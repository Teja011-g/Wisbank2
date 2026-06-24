from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)

    bank_name = Column(String(100))
    campaign_name = Column(String(150))
    customer_code = Column(String(50))

    age = Column(Integer)
    job = Column(String(100))
    education = Column(String(100))
    contact = Column(String(50))

    prediction = Column(String(50))
    prediction_label = Column(Integer)

    yes_probability = Column(Float)
    no_probability = Column(Float)
    confidence = Column(Float)

    lead_priority = Column(String(50))
    recommended_action = Column(String(255))

    call_status = Column(String(50), default="Not Called")
    lead_status = Column(String(50), default="New")

    created_at = Column(DateTime(timezone=True), server_default=func.now())