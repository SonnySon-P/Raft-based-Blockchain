// 載入套件
const express = require("express");
const axios = require("axios");
const { setInterval } = require("timers");
const crypto = require("crypto");
const cors = require("cors");

// 常量定義
const HEARTBEAT_INTERVAL = 1000;  // 心跳間隔時間
const MIN_ELECTION_TIMEOUT = 3;  // 最短選舉超時時間
const MAX_ELECTION_TIMEOUT = 5;  // 最長選舉超時時間

// 節點類別
class Node {
    constructor(nodeID, port, peers) {
        this.nodeID = nodeID;  // 節點ID
        this.port = port;  // 節點的port
        this.peers = peers;  // 其他節點的地址列表
        this.state = "Follower";  // 節點的初始狀態為跟隨者
        this.term = 0;  // 任期，初始為0
        this.votes = {};  // 記錄每個任期投票給哪位候選人
        this.votesReceived = 0; // 記錄收到的選票數量
        this.lastHeartbeat = Date.now(); // 最後心跳時間
        this.electionTimeout = Math.floor(Math.random() * (MAX_ELECTION_TIMEOUT - MIN_ELECTION_TIMEOUT) + MIN_ELECTION_TIMEOUT) * 1000;  // 隨機選舉超時時間
        this.blockchain = [this.makeBlock(0, Date.now(), 0, 0, "Genesis Block", "0")];  // 節點的區塊鏈
        this.leaderID = null;  // 當前領袖ID，默認為空
        this.voteGranted = false;  // 用來跟蹤是否已經給過選票
        this.votesInThisTerm = 0;  // 追蹤當前任期收到的投票數
        this.votesForLeader = 0;  // 記錄是否已經支持領袖
    }

    // Hash函式
    hash(index, timestamp, nodeID, term, data,previousHash) {
        const sha256 = crypto.createHash("sha256");
        sha256.update(`${index}${timestamp}${nodeID}${data}${term}${previousHash}`);
        return sha256.digest("hex");
    }

    // 製作一個區塊
    makeBlock(index, timestamp, nodeID, term, data, previousHash) {
        const block = {};
        block.index = index;
        block.timestamp = timestamp;
        block.proposerID = nodeID,
        block.term = term,
        block.data = data;
        block.previousHash = previousHash;
        block.hash = this.hash(index, timestamp, nodeID, term, data,previousHash);
        return block;
    }

    // 創建一個新區塊
    createBlock(data) {
        const lastBlock = this.blockchain[this.blockchain.length - 1];
        const index = lastBlock.index + 1;
        const timestamp = Date.now();
        const previousHash = lastBlock.hash;
        return this.makeBlock(index, timestamp, this.nodeID, this.term, data, previousHash);
    }

    // 接受其他節點為領袖
    setLeader(leaderID) {
        this.leaderID = leaderID;
        this.becomeFollower();  // 成為跟隨者
        console.log(`[Node ${this.nodeID}] Recognizes Node ${leaderID} as Leader for term ${this.term}`);
    }

    // 自己當選為領袖
    becomeLeader() {
        this.state = "Leader";
        this.leaderID = this.nodeID;
        this.term += 1;  // 任期加1
        console.log(`[Node ${this.nodeID}] Node ${this.nodeID} is now the Leader of term ${this.term}`);
        this.startHeartbeat();  // 確定成為領袖後啟動心跳
    }

    // 成為候選人
    becomeCandidate() {
        this.state = "Candidate";
        this.term += 1;
        this.votesReceived = 1;  // 自己投給自己一票
        this.votes[this.term] = this.nodeID;  // 記錄當前任期自己投給自己
        this.voteGranted = false;  // 重置投票狀態
        this.votesInThisTerm = 1;  // 記錄當前任期收到的投票數
        this.sendRequestVotes();  // 發送選舉請求
    }

    // 成為跟隨者
    becomeFollower() {
        this.state = "Follower";
        this.resetElectionTimeout();  // 重置選舉超時時間
    }

    // 重置選舉超時計時器
    resetElectionTimeout() {
        this.electionTimeout = Math.floor(Math.random() * (MAX_ELECTION_TIMEOUT - MIN_ELECTION_TIMEOUT) + MIN_ELECTION_TIMEOUT) * 1000;
        this.lastHeartbeat = Date.now();  // 記錄當前時間作為最後心跳時間
    }

    // 發送心跳
    async sendHeartbeat() {
        // 領袖向每個節點發送心跳請求
        for (const peerID in this.peers) {
            if (peerID != this.nodeID) {
                const peer = this.peers[peerID];
                try {
                    await axios.post(`http://${peer}/heartbeat`, {
                        leaderID: this.nodeID,
                        term: this.term
                    });
                    console.log(`[Node ${this.nodeID}] Sent heartbeat to Node ${peerID}`);
                } catch (err) {
                    console.error(`[Node ${this.nodeID}] Error sending heartbeat to Node ${peerID}: ${err.message}`);
                }
            }
        }
    }

    // 發送請求投票
    async sendRequestVotes() {
        for (const peerID in this.peers) {
            if (peerID != this.nodeID) {
                const peer = this.peers[peerID];
                try {
                    const response = await axios.post(`http://${peer}/requestVote`, {
                        candidateId: this.nodeID,
                        term: this.term
                    });

                    if (response.data.voteGranted) {
                        this.votesReceived += 1;
                    }

                    // 如果投票數過半，則成為領袖
                    if (this.votesReceived > Math.floor(Object.keys(this.peers).length / 2)) {
                        this.becomeLeader();  // 成為領袖
                        break;  // 一旦當選領袖，停止選舉
                    }
                } catch (err) {
                    console.error(`[Node ${this.nodeID}] Error sending vote request to Node ${peerID}: ${err.message}`);
                }
            }
        }
    }

    // 發送追加區塊給領袖
    async sendAppendBlockToLeader(block) {
        if (this.state === "Follower" && this.leaderID !== null) {
            try {
                await axios.post(`http://${this.peers[this.leaderID]}/appendBlockToLeader`, {
                    block: block
                });
                console.log(`[Node ${this.nodeID}] Sent new block to Node ${this.leaderID}`);
            } catch (err) {
                console.error(`[Node ${this.nodeID}] Error sending append block to Node ${this.leaderID}: ${err.message}`);
            }
        }
    }

    // 發送追加區塊給所有跟隨者
    async sendAppendBlockToFollowers(block) {
        if (this.blockchain.length > 1) {
            for (const peerID in this.peers) {
                if (peerID != this.nodeID) {
                    const peer = this.peers[peerID];
                    try {
                        const response = await axios.post(`http://${peer}/receivingAppendBlock`, {
                            term: this.term,
                            previousBlockchainIndex: this.blockchain[this.blockchain.length - 2].index,  // 上一個區塊的索引
                            previousBlockchainTerm: this.blockchain[this.blockchain.length - 2].term,  // 上一個區塊的任期
                            block: block
                        });
            
                        if (response.data.success) {
                            console.log(`[Node ${this.nodeID}] Successfully sent block to Node ${peerID}`);
                        } else {
                            console.error(`[Node ${this.nodeID}] Failed to send block to Node ${peerID}`);
                        }
                    } catch (err) {
                        console.error(`[Node ${this.nodeID}] Error sending block to Node ${peerID}: ${err.message}`);
                    }
                }
            }
        } else {
            console.error(`[Node ${this.nodeID}] Blockchain is empty`);
        }
    }

    // 定期檢查節點是否應該發起選舉    
    startTimeoutCheck() {
        setInterval(() => {
            if (this.state !== "Leader" && this.electionTimeout < Date.now() - this.lastHeartbeat) {
                console.log(`[Node ${this.nodeID}] Election timeout.`);
                this.becomeCandidate();  // 發起選舉
            }

            if (this.state === "Leader") {
                this.sendHeartbeat();  // 發送心跳
            }
        }, HEARTBEAT_INTERVAL);
    }

    // 以領袖身份啟動心跳發送
    startHeartbeat() {
        setInterval(() => {
            if (this.state === "Leader") {
                this.sendHeartbeat();
            }
        }, HEARTBEAT_INTERVAL);
    }

    // RESTful API服務
    startExpressServer() {
        const app = express();
        app.use(express.json());
        app.use(cors());

        // 心跳請求
        app.post("/heartbeat", (req, res) => {
            const { leaderID, term } = req.body;

            // 如果收到更高的任期，則更新為跟隨者
            if (this.term <= term) {
                this.term = term;
                this.setLeader(leaderID);  // 成為跟隨者並設置領袖
            }
            return res.status(200).json({ status: "Heartbeat received" });
        });

        // 選舉請求
        app.post("/requestVote", (req, res) => {
            const { candidateID, term } = req.body;

            // 如果收到更高的任期，則更新為跟隨者
            if (this.term < term) {
                this.term = term;  // 更新任期
                this.votes[term] = candidateID;  // 記錄投票給哪個候選人
                this.becomeFollower();  // 轉為跟隨者
                return res.status(200).json({ voteGranted: true });  // 投票支持候選人
            }
            return res.status(200).json({ voteGranted: false });  // 不會投票給候選人
        });

        // 接收用戶向節點發送要創建區塊的訊息
        app.post("/appendBlockToNode", (req, res) => {
            const { data } = req.body;

            // 創建一個區塊
            const block = this.createBlock(data);

            if (this.state === "Leader") {
                this.blockchain.push(block);
                this.sendAppendBlockToFollowers(block);
            } else {
                this.sendAppendBlockToLeader(block);
            }
            return res.status(200).json({ status: "Send success to the node" });
        });

        // 接收跟隨者向領袖發送追加區塊
        app.post("/appendBlockToLeader", (req, res) => {
            if (this.state === "Leader") {
                const block = req.body;
                this.blockchain.push(block);
                this.sendAppendBlockToFollowers(block);
                return res.status(200).json({ status: "Blockchain block added" });
            }
            return res.status(400).json({ error: "Only Leader can append block" });
        });

        // 接收領袖發送追加區塊請求
        app.post("/receivingAppendBlock", (req, res) => {
            const { term, previousBlockchainIndex, previousBlockchainTerm, block } = req.body;
        
            if (this.term <= term) {
                this.term = term;  // 更新任期
                this.becomeFollower();  // 如果任期較新，成為跟隨者

                // 檢查日誌上一條條目的任期是否一致
                const previousBlockchain = this.blockchain[previousBlockchainIndex];
                if (previousBlockchain && previousBlockchain.term === previousBlockchainTerm) {
                    this.blockchain.push(block);
                    return res.status(200).json({ success: true });  // 回應領導者，表示成功添加了追加條目
                }
                return res.status(400).json({ error: "Block mismatch" });
            } else {
                return res.status(400).json({ error: "Outdated term" });
            }
        });

        // 獲取整個區塊鏈
        app.get("/blocks", (req, res) => {
            res.status(200).json(this.blockchain);
        });

        // 啟動Express應用程式
        app.listen(this.port, "0.0.0.0", () => {
            console.log(`Server running on port ${this.port}.`);
        });
    }

    // 並行運作兩個工作，讓Raft在每個節點上正常運作
    start() {
        this.startExpressServer();  // 啟動一個RESTful API服務
        this.startTimeoutCheck();  // 定期檢查節點是否應該發起選舉，或者是否應該繼續作為跟隨者
    }
}

// 啟動節點
const node = new Node(2, 7092, { 1: "ndmi:3095", 2: "client:7092" });
node.start();
