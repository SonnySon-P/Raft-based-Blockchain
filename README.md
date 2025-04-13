# Raft based Blockchain

一、目標： 以下程式碼旨在實現多張影像的自動拼接功能。

二、使用語言： Python

三、相依套件： openCV

四、開發IDE： Visual Studio Code

五、程式碼說明：
1. main1.py: 使用openCV的stitcher進行影像拼接
2. main2.py: 使用openCV獲取特徵點，並運用Homography Matrix計算

六、成果展示：
1. main1.py
<br>
<div align="center">
	<img src="./截圖1.png" alt="Editor" width="500">
</div>
<br>

2. main2.py
<br>
<div align="center">
	<img src="./截圖2.png" alt="Editor" width="500">
</div>
<br>
   
七、未來規劃： 本次實作以同一張影像進行切割，模擬多張照片的影像拼接過程。然而在實際應用中發現，拼接結果容易受到影像處理順序的影響，進而影響演算法的穩定性與成功率。以本次測試為例，某些情況下main1.py表現優於main2.py，但在不同條件下則可能相反。
此外，實際拍攝通常是透過鏡頭在不同時間與角度取得多張照片，面對這類更具挑戰性的情境，影像拼接將變得更加複雜。因此，未來可進一步朝向真實環境下的影像拼接挑戰，作為進階實作與優化的方向。
