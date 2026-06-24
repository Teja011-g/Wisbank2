from pathlib import Path
import traceback

MODEL_LOADED = False
MODEL_ERROR = None

artifacts = None
model = None
features = None
reverse_target_mapping = None
model_name = None


def load_model_safely():
    global MODEL_LOADED
    global MODEL_ERROR
    global artifacts
    global model
    global features
    global reverse_target_mapping
    global model_name

    try:
        import joblib

        model_path = Path(__file__).resolve().parent.parent / "model" / "loan_approval_artifacts.pkl"

        if not model_path.exists():
            MODEL_LOADED = False
            MODEL_ERROR = f"Model file not found at {model_path}"
            return

        artifacts = joblib.load(model_path)

        model = artifacts.get("model")
        features = artifacts.get("features")
        reverse_target_mapping = artifacts.get("reverse_target_mapping")
        model_name = artifacts.get("model_name", "Loan Approval Model")

        MODEL_LOADED = True
        MODEL_ERROR = None

    except Exception as error:
        MODEL_LOADED = False
        MODEL_ERROR = str(error)
        print("Loan model failed to load:")
        print(traceback.format_exc())


load_model_safely()


def check_loan_model_loaded():
    return {
        "model_loaded": MODEL_LOADED,
        "model_name": model_name if model_name else "Not Available",
        "features": features if features else [],
        "error": MODEL_ERROR,
    }


def calculate_rule_based_result(input_data):
    income = input_data.get("income_annum", 0)
    loan_amount = input_data.get("loan_amount", 0)
    cibil_score = input_data.get("cibil_score", 0)

    residential_assets = input_data.get("residential_assets_value", 0)
    commercial_assets = input_data.get("commercial_assets_value", 0)
    luxury_assets = input_data.get("luxury_assets_value", 0)
    bank_assets = input_data.get("bank_asset_value", 0)

    total_assets_value = (
        residential_assets
        + commercial_assets
        + luxury_assets
        + bank_assets
    )

    loan_to_income_ratio = round(loan_amount / income, 2) if income else 0
    loan_to_assets_ratio = round(loan_amount / total_assets_value, 2) if total_assets_value else 0
    asset_to_income_ratio = round(total_assets_value / income, 2) if income else 0

    risk_score = 0
    risk_reasons = []

    if cibil_score < 600:
        risk_score += 40
        risk_reasons.append("Low CIBIL score")
    elif cibil_score < 700:
        risk_score += 20
        risk_reasons.append("Average CIBIL score")

    if loan_to_income_ratio > 5:
        risk_score += 30
        risk_reasons.append("Loan amount is high compared to income")
    elif loan_to_income_ratio > 3:
        risk_score += 15
        risk_reasons.append("Loan amount is moderately high compared to income")

    if loan_to_assets_ratio > 0.8:
        risk_score += 20
        risk_reasons.append("Loan amount is high compared to assets")

    if risk_score >= 60:
        risk_level = "High"
        prediction_status = "Rejected"
        approved_probability = 25
        rejected_probability = 75
        suggested_status = "Reject"
    elif risk_score >= 30:
        risk_level = "Medium"
        prediction_status = "Approved"
        approved_probability = 62
        rejected_probability = 38
        suggested_status = "Manual Review"
    else:
        risk_level = "Low"
        prediction_status = "Approved"
        approved_probability = 88
        rejected_probability = 12
        suggested_status = "Approve"

    if not risk_reasons:
        risk_reasons.append("Good repayment profile and acceptable risk")

    return {
        "prediction_status": prediction_status,
        "approved_probability": approved_probability,
        "rejected_probability": rejected_probability,
        "suggested_status": suggested_status,
        "total_assets_value": total_assets_value,
        "loan_to_income_ratio": loan_to_income_ratio,
        "loan_to_assets_ratio": loan_to_assets_ratio,
        "asset_to_income_ratio": asset_to_income_ratio,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_reasons": risk_reasons,
        "model_used": "Rule Based Fallback",
    }


def predict_loan_approval(input_data):
    if not MODEL_LOADED:
        return calculate_rule_based_result(input_data)

    try:
        import pandas as pd

        df = pd.DataFrame([input_data])

        prediction = model.predict(df)[0]

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(df)[0]
            rejected_probability = round(float(probabilities[0]) * 100, 2)
            approved_probability = round(float(probabilities[1]) * 100, 2)
        else:
            approved_probability = 70
            rejected_probability = 30

        prediction_status = reverse_target_mapping.get(
            int(prediction),
            "Approved"
        )

        residential_assets = input_data.get("residential_assets_value", 0)
        commercial_assets = input_data.get("commercial_assets_value", 0)
        luxury_assets = input_data.get("luxury_assets_value", 0)
        bank_assets = input_data.get("bank_asset_value", 0)

        income = input_data.get("income_annum", 0)
        loan_amount = input_data.get("loan_amount", 0)

        total_assets_value = (
            residential_assets
            + commercial_assets
            + luxury_assets
            + bank_assets
        )

        loan_to_income_ratio = round(loan_amount / income, 2) if income else 0
        loan_to_assets_ratio = round(loan_amount / total_assets_value, 2) if total_assets_value else 0
        asset_to_income_ratio = round(total_assets_value / income, 2) if income else 0

        risk_score = 0
        risk_reasons = []

        cibil_score = input_data.get("cibil_score", 0)

        if cibil_score < 600:
            risk_score += 40
            risk_reasons.append("Low CIBIL score")
        elif cibil_score < 700:
            risk_score += 20
            risk_reasons.append("Average CIBIL score")

        if loan_to_income_ratio > 5:
            risk_score += 30
            risk_reasons.append("Loan amount is high compared to income")
        elif loan_to_income_ratio > 3:
            risk_score += 15
            risk_reasons.append("Loan amount is moderately high compared to income")

        if loan_to_assets_ratio > 0.8:
            risk_score += 20
            risk_reasons.append("Loan amount is high compared to assets")

        if risk_score >= 60:
            risk_level = "High"
            suggested_status = "Reject"
        elif risk_score >= 30:
            risk_level = "Medium"
            suggested_status = "Manual Review"
        else:
            risk_level = "Low"
            suggested_status = "Approve"

        if not risk_reasons:
            risk_reasons.append("Good repayment profile and acceptable risk")

        return {
            "prediction_status": prediction_status,
            "approved_probability": approved_probability,
            "rejected_probability": rejected_probability,
            "suggested_status": suggested_status,
            "total_assets_value": total_assets_value,
            "loan_to_income_ratio": loan_to_income_ratio,
            "loan_to_assets_ratio": loan_to_assets_ratio,
            "asset_to_income_ratio": asset_to_income_ratio,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_reasons": risk_reasons,
            "model_used": model_name,
        }

    except Exception as error:
        print("ML prediction failed. Using fallback.")
        print(error)
        return calculate_rule_based_result(input_data)