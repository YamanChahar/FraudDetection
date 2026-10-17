# Dataset Instructions

This project uses the **ULB Credit Card Fraud Detection** dataset.

## Source
- **Kaggle**: [Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
- **Original Source**: Machine Learning Group (MLG) at Université Libre de Bruxelles (ULB).

## Setup Instructions
1. Download `creditcard.csv` (or the archive containing it) from the link above.
2. Place the uncompressed `creditcard.csv` directly into this folder:
   ```
   data/creditcard.csv
   ```
3. The dataset file is deliberately ignored by `.gitignore` to prevent committing large binary/CSV files to source control.

## Schema Expected
- **Rows**: ~284,807 transaction records
- **Features**: 
  - `Time`: Number of seconds elapsed between this transaction and the first transaction in the dataset.
  - `V1` to `V28`: Anonymized principal component features obtained via PCA.
  - `Amount`: Transaction amount.
  - `Class`: Ground-truth label (`0` for legitimate, `1` for fraudulent).
