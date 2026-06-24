import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.cluster import KMeans
from sklearn.metrics import classification_report, accuracy_score

from xgboost import XGBClassifier


# ---------------------------------------------------------
# 1. File paths
# ---------------------------------------------------------

DATA_PATH = "data/bank-additional-full.csv"
MODEL_FOLDER = "model"
MODEL_PATH = "model/bank_marketing_artifacts.pkl"

os.makedirs(MODEL_FOLDER, exist_ok=True)


# ---------------------------------------------------------
# 2. Load dataset
# ---------------------------------------------------------

df = pd.read_csv(DATA_PATH, sep=";")

print("Dataset loaded successfully")
print("Dataset shape:", df.shape)
print(df.head())


# ---------------------------------------------------------
# 3. Separate input features and target
# ---------------------------------------------------------

X = df.drop("y", axis=1)
y = df["y"]

# Convert target labels into numbers
# no  -> 0
# yes -> 1
y = y.map({
    "no": 0,
    "yes": 1
})

print("\nTarget distribution:")
print(y.value_counts())
print(y.value_counts(normalize=True) * 100)


# ---------------------------------------------------------
# 4. Identify categorical and numerical columns
# ---------------------------------------------------------

categorical_columns = X.select_dtypes(include=["object"]).columns.tolist()
numerical_columns = X.select_dtypes(exclude=["object"]).columns.tolist()

print("\nCategorical columns:")
print(categorical_columns)

print("\nNumerical columns:")
print(numerical_columns)


# ---------------------------------------------------------
# 5. Train-test split
# ---------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining shape:", X_train.shape)
print("Testing shape:", X_test.shape)


# ---------------------------------------------------------
# 6. Preprocessing
# ---------------------------------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "cat",
            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            categorical_columns
        ),
        (
            "num",
            StandardScaler(),
            numerical_columns
        )
    ]
)

X_train_encoded = preprocessor.fit_transform(X_train)
X_test_encoded = preprocessor.transform(X_test)

print("\nPreprocessing completed")
print("Encoded train shape:", X_train_encoded.shape)
print("Encoded test shape:", X_test_encoded.shape)


# ---------------------------------------------------------
# 7. KMeans clustering
# ---------------------------------------------------------

kmeans = KMeans(
    n_clusters=6,
    random_state=42,
    n_init=10
)

train_clusters = kmeans.fit_predict(X_train_encoded)
test_clusters = kmeans.predict(X_test_encoded)

print("\nKMeans clustering completed")
print("Train clusters:", pd.Series(train_clusters).value_counts().sort_index())


# ---------------------------------------------------------
# 8. Add cluster column to encoded data
# ---------------------------------------------------------

X_train_final = pd.DataFrame(X_train_encoded)
X_test_final = pd.DataFrame(X_test_encoded)

X_train_final["cluster"] = train_clusters
X_test_final["cluster"] = test_clusters

print("\nFinal training data shape after adding cluster:", X_train_final.shape)
print("Final testing data shape after adding cluster:", X_test_final.shape)


# ---------------------------------------------------------
# 9. Handle class imbalance
# ---------------------------------------------------------

negative_count = (y_train == 0).sum()
positive_count = (y_train == 1).sum()

scale_pos_weight = negative_count / positive_count

print("\nNegative count:", negative_count)
print("Positive count:", positive_count)
print("Scale pos weight:", scale_pos_weight)


# ---------------------------------------------------------
# 10. Train XGBoost model
# ---------------------------------------------------------

model = XGBClassifier(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    eval_metric="logloss",
    random_state=42
)

model.fit(X_train_final, y_train)

print("\nXGBoost model training completed")


# ---------------------------------------------------------
# 11. Check model with different thresholds
# ---------------------------------------------------------

y_proba = model.predict_proba(X_test_final)[:, 1]

thresholds = [0.52, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]

print("\nThreshold comparison:")

for threshold in thresholds:
    y_pred_threshold = (y_proba >= threshold).astype(int)

    print("\nThreshold:", threshold)
    print(classification_report(y_test, y_pred_threshold))
    print("-" * 50)


# ---------------------------------------------------------
# 12. Choose final threshold
# ---------------------------------------------------------

FINAL_THRESHOLD = 0.60

final_predictions = (y_proba >= FINAL_THRESHOLD).astype(int)

print("\nFinal selected threshold:", FINAL_THRESHOLD)
print("\nFinal classification report:")
print(classification_report(y_test, final_predictions))

print("Final accuracy:", accuracy_score(y_test, final_predictions))


# ---------------------------------------------------------
# 13. Test one manual customer
# ---------------------------------------------------------

sample_customer = {
    "age": 35,
    "job": "management",
    "marital": "married",
    "education": "university.degree",
    "default": "no",
    "housing": "no",
    "loan": "no",
    "contact": "cellular",
    "month": "may",
    "day_of_week": "mon",
    "duration": 600,
    "campaign": 1,
    "pdays": 90,
    "previous": 2,
    "poutcome": "success",
    "emp.var.rate": -1.8,
    "cons.price.idx": 92.893,
    "cons.conf.idx": -46.2,
    "euribor3m": 1.299,
    "nr.employed": 5099.1
}


def predict_single_customer(customer_data):
    input_df = pd.DataFrame([customer_data])

    # Keep same column order as training data
    input_df = input_df[X_train.columns]

    input_encoded = preprocessor.transform(input_df)

    input_cluster = kmeans.predict(input_encoded)

    input_final = pd.DataFrame(input_encoded)
    input_final["cluster"] = input_cluster

    probabilities = model.predict_proba(input_final)[0]

    yes_probability = probabilities[1]
    no_probability = probabilities[0]

    prediction_label = 1 if yes_probability >= FINAL_THRESHOLD else 0

    prediction_text = (
        "Will Subscribe"
        if prediction_label == 1
        else "Will Not Subscribe"
    )

    confidence = max(yes_probability, no_probability) * 100

    if confidence >= 80:
        risk_level = "Low"
    elif confidence >= 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    return {
        "prediction": prediction_text,
        "prediction_label": prediction_label,
        "yes_probability": round(yes_probability * 100, 2),
        "no_probability": round(no_probability * 100, 2),
        "confidence": round(confidence, 2),
        "risk_level": risk_level,
        "threshold_used": FINAL_THRESHOLD
    }


print("\nManual sample prediction:")
print(predict_single_customer(sample_customer))


# ---------------------------------------------------------
# 14. Save deployment artifacts
# ---------------------------------------------------------

deployment_artifacts = {
    "preprocessor": preprocessor,
    "kmeans": kmeans,
    "model": model,
    "threshold": FINAL_THRESHOLD,
    "columns": list(X_train.columns),
    "categorical_columns": categorical_columns,
    "numerical_columns": numerical_columns
}

joblib.dump(deployment_artifacts, MODEL_PATH)

print("\nDeployment artifacts saved successfully")
print("Saved at:", MODEL_PATH)


# ---------------------------------------------------------
# 15. Test saved file
# ---------------------------------------------------------

loaded_artifacts = joblib.load(MODEL_PATH)

print("\nSaved file loaded successfully")
print("Saved threshold:", loaded_artifacts["threshold"])
print("Number of columns:", len(loaded_artifacts["columns"]))
print("Columns:")
print(loaded_artifacts["columns"])
print("Model classes:", loaded_artifacts["model"].classes_)