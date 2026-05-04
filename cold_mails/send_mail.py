import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# ─── Email Templates ───────────────────────────────────────────────────────────

FRIENDLY_SUBJECT = "Struggling with DSA? Watch it come to life 🎯"

FRIENDLY_BODY = """
Hi {name},

Most students don't fail DSA because they're not smart — they fail because textbooks make it invisible.

That's exactly why I built Shahira Code.

Shahira Code is a platform that turns complex Data Structures & Algorithms into 
step-by-step animations, so you can actually see what's happening inside a Binary Tree, 
a Sorting Algorithm, or a Graph — instead of just staring at code and hoping it clicks.

✅ Visual, animated explanations for every major DSA topic
✅ Beginner-friendly — no prior experience needed
✅ Learn at your own pace, one animation at a time

Whether you're preparing for coding interviews or just starting your CS journey, 
Shahira Code makes DSA feel less like a wall and more like a puzzle you can actually solve.

👉 Check it out: https://your-website-link.com

Would love to hear what you think!

Warm regards,
Maviya Shaik
Founder, Shahira Code
"""

PROFESSIONAL_SUBJECT = "A smarter way to teach DSA to your students"

PROFESSIONAL_BODY = """
Hi {name},

I hope this message finds you well.

I'm reaching out because I noticed you teach Data Structures & Algorithms, 
and I wanted to share a tool that your students might find genuinely useful.

I recently launched Shahira Code — a platform designed to make DSA concepts easier 
to understand through interactive animations. Instead of reading static code, students 
can visually follow each step of an algorithm or data structure in real time.

Here's what makes it different:

- Animated, step-by-step walkthroughs of DSA concepts  
- Covers core topics: Arrays, Linked Lists, Trees, Graphs, Sorting, and more  
- Designed specifically for students who struggle with abstract thinking in code  

I believe it could serve as a great supplementary resource alongside your course material.

I'd love to offer your students free access — no strings attached. If you're open to it, 
I'd be happy to share more details or set up a quick demo.

👉 Explore the platform: https://your-website-link.com

Thank you for your time, and I look forward to hearing from you.

Best regards,
Maviya Shaik
Founder, Shahira Code
maviyashaik.dev@gmail.com | https://your-website-link.com
"""

# ─── Email Sender Function ─────────────────────────────────────────────────────

def send_email(sender_email, sender_password, recipient_email, recipient_name, subject, body):
    """
    Send a personalized cold email to a single recipient.

    Args:
        sender_email (str): Your Gmail address
        sender_password (str): Your Gmail App Password
        recipient_email (str): Recipient's email address
        recipient_name (str): Recipient's name for personalization
        subject (str): Email subject line
        body (str): Email body template (use {name} for personalization)
    """
    message = MIMEMultipart("alternative")
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = subject

    # Personalize the body with recipient's name
    personalized_body = body.format(name=recipient_name)
    message.attach(MIMEText(personalized_body, "plain"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, message.as_string())
        print(f"✅ Email sent to {recipient_name} <{recipient_email}>")

    except smtplib.SMTPAuthenticationError:
        print("❌ Authentication failed. Check your email/app password.")
    except smtplib.SMTPException as e:
        print(f"❌ Failed to send to {recipient_email}: {e}")


def send_bulk_emails(sender_email, sender_password, recipients, email_type="friendly"):
    """
    Send cold emails to a list of recipients.

    Args:
        sender_email (str): Your Gmail address
        sender_password (str): Your Gmail App Password
        recipients (list): List of dicts → [{"name": "Alice", "email": "alice@example.com", "type": "friendly"}]
        email_type (str): Default template — "friendly" or "professional"
    """
    print(f"\n📤 Sending Shahira Code cold emails to {len(recipients)} recipient(s)...\n")

    for person in recipients:
        name  = person.get("name", "there")
        email = person.get("email")
        kind  = person.get("type", email_type)   # per-recipient override

        if kind == "professional":
            subject = PROFESSIONAL_SUBJECT
            body    = PROFESSIONAL_BODY
        else:
            subject = FRIENDLY_SUBJECT
            body    = FRIENDLY_BODY

        send_email(sender_email, sender_password, email, name, subject, body)

    print("\n🎉 All emails processed!")


# ─── Configuration ─────────────────────────────────────────────────────────────

SENDER_EMAIL    = os.environ.get("GMAIL_ADDRESS", "maviyashaik.dev@gmail.com")
SENDER_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "njsq ylae ivww ozer")

# Add your recipients here — set "type" per person if needed
RECIPIENTS = [
    {"name": "Alice",      "email": "alice@example.com",      "type": "friendly"},       # student
    {"name": "Maviya",        "email": "shaik.mavi@gmail.com", "type": "professional"},       # student
    {"name": "Dr. Smith",  "email": "drsmith@university.edu", "type": "professional"},   # professor
    {"name": "Prof. Sara", "email": "sara@bootcamp.com",      "type": "professional"},   # instructor
]

# ─── Run ───────────────────────────────────────────────────────────────────────

send_bulk_emails(SENDER_EMAIL, SENDER_PASSWORD, RECIPIENTS)