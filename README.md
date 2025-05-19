# Raft based Blockchain

基於Raft共識算法打造的高效區塊鏈系統，旨在提供更為可靠、安全與去中心化的分佈式資訊共享解決方案。透過一致性機制確保網絡中的節點在面對故障或攻擊時，仍能保持一致性與數據完整性。

## 壹、基本說明
**一、目標：**
這個RESTful API平台旨在為前端提供高效的部落格帳戶與貼文管理功能，支援用戶註冊與登入、貼文創建、瀏覽、修改和刪除等常見操作。平台開發基於PostgreSQL、Node.js及相關套件，除了實現常規的安全防護措施外，我們還針對軟體的正確性與完整性進行了嚴格的單元測試，並使用Jest測試框架來確保系統的穩定性與可靠性。
<br>

**二、開發環境：**
以下是開發該平台所採用的環境：
* 虛擬機：Docker
* 程式語言：JavaScript
* JavaScript執行環境：Node.js
* Node.js資源管理工具：npm
* 程式編輯器：Visual Studio Code

**三、使用相依套件：**
以下是開發該平台所使用的Node.js套件：
* express（Web應用程式架構）
* axios（API請求）
* cors (跨來源資源共用)

## 貳、操作說明
**一、安裝程式方式：** 
從GitHub下載該檔案，由於前後端採用分離的系統架構，其安裝方式亦有所差異，具體操作如下所示：
1. Backend
* 安裝Node、NPM跟MongoDB
* 創建一個資料夾，建立專案
```bash
mkdir <資料夾名稱>
cd <資料夾名稱>
npm init -y
```
* 安裝套件
```bash
npm install express
npm install cors
npm install dotenv
npm install bcrypt
npm install jsonwebtoken
npm install multer
npm install nodemon
```
**二、運行結果：**
當前後端架構完成建置後，您只需在瀏覽器中輸入127.0.0.1:8080/login以開啟應用程式。以下展示的是系統實際呈現的網頁畫面。
* 執行伺服器
```bash
npm run serve
```
**三、對Node的RESTful API請求：** 
以下是此後端平台提供的RESTful API端點，包含對應的HTML方法、路徑及參數說明，如下所示：
* `POST` /appendBlockToNode：用戶向節點發送要創建區塊的訊息(請求內容有data)
* `GET` /blocks：獲取整個區塊鏈
   
七、未來規劃： 本次實作以同一張影像進行切割，模擬多張照片的影像拼接過程。然而在實際應用中發現，拼接結果容易受到影像處理順序的影響，進而影響演算法的穩定性與成功率。以本次測試為例，某些情況下main1.py表現優於main2.py，但在不同條件下則可能相反。
此外，實際拍攝通常是透過鏡頭在不同時間與角度取得多張照片，面對這類更具挑戰性的情境，影像拼接將變得更加複雜。因此，未來可進一步朝向真實環境下的影像拼接挑戰，作為進階實作與優化的方向。
