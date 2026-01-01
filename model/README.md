```

pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu126
pip install -U yfinance
pip install -U pandas
pip install -U matplotlib
pip install -U praw
pip install -U xgboost
pip install -U scikit-learn
pip install -U pytest
pip install -U openpyxl
<!-- pip install -U httpx -->
```


3d graph
x = region
y = year
z1 = gva per sector
z2 = employment per sector

$$
\text{Stock Risk Index} = \min\left( \text{MA5}\left( \text{SimpleNN}\left( \text{RatioDiff}\left( \text{LSTM}\left( \text{Price}, \text{Volume}\right), [\text{Actual Price}, \text{Actual Volume}]\right) \right), \text{XGBoost}\left( \text{BullishCount}, \text{BearishCount}, \max\left(\text{MA7}\left(\text{SPY}\right), 0\right), \text{VIX}, \text{FGI}\right), \text{Altman Z-Score}\left(Z=1.2A+1.4B+3.3C+0.6D+1.0E\right)\right) \right) \times -1, 0.001 \right)
$$