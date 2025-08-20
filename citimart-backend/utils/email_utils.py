import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()

EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))  # safe fallback
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

# ✅ Debug prints to verify .env is working
print("SMTP HOST:", EMAIL_HOST)
print("SMTP USER:", EMAIL_HOST_USER)
print("SMTP PASS Length:", len(EMAIL_HOST_PASSWORD) if EMAIL_HOST_PASSWORD else "None")

def send_email(to_email, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_HOST_USER
    msg['To'] = to_email

    try:
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        server.sendmail(EMAIL_HOST_USER, [to_email], msg.as_string())
        server.quit()
        print("✅ Email sent successfully.")
        return True
    except Exception as e:
        print("❌ Email send error:", e)
        return False

#----Vendor approval email ------
def send_vendor_approval_email(vendor_email, vendor_name, reset_token):
    try:
        link = f"{os.getenv('FRONTEND_URL')}/set-password/{reset_token}"
        subject = "Your Vendor Account has been Approved!"
        body = f"""
Hi {vendor_name},

Congratulations! Your vendor application has been approved by Citimart Admin.

To activate your account, please click the link below to set your password:

{link}

This link is valid for one-time use only.

If you did not request this, please ignore this email.

Thank you,
Citimart Team
"""
        return send_email(vendor_email, subject, body)
    except Exception as e:
        print("❌ Vendor approval email error:", e)
        return False
