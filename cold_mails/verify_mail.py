import re
import smtplib
import dns.resolver  # pip install dnspython
from concurrent.futures import ThreadPoolExecutor, as_completed

# ─── Step 1: Syntax Check ─────────────────────────────────────────────────────

def check_syntax(email):
    """Check if the email format is valid."""
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

# ─── Step 2: MX Record Check ──────────────────────────────────────────────────

def check_mx_record(email):
    """Check if the email domain has valid mail servers (MX records)."""
    try:
        domain = email.split("@")[1]
        records = dns.resolver.resolve(domain, "MX")
        # Return the best (lowest priority) mail server
        mx_record = sorted(records, key=lambda r: r.preference)[0]
        return True, str(mx_record.exchange)
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.DNSException):
        return False, None

# ─── Step 3: SMTP Mailbox Check ───────────────────────────────────────────────

def check_smtp(email, mx_server, timeout=10):
    """
    Connect to the mail server and check if the mailbox actually exists.
    This is exactly what verify-email.org does behind the scenes.
    """
    try:
        with smtplib.SMTP(timeout=timeout) as smtp:
            smtp.connect(mx_server)
            smtp.helo("shahiracode.com")           # introduce ourselves
            smtp.mail("verify@shahiracode.com")    # fake sender
            code, _ = smtp.rcpt(email)             # ask if recipient exists
            smtp.quit()
            return code == 250                     # 250 = mailbox exists ✅
    except Exception:
        return None   # None = server blocked the check (inconclusive)

# ─── Main Verifier ────────────────────────────────────────────────────────────

def verify_email(email):
    """
    Full 3-layer email verification.

    Returns a dict with:
      - email       : the email checked
      - valid       : True / False / None (inconclusive)
      - reason      : explanation of the result
      - syntax_ok   : bool
      - mx_ok       : bool
      - smtp_ok     : bool / None
    """
    result = {
        "email"     : email,
        "valid"     : False,
        "reason"    : "",
        "syntax_ok" : False,
        "mx_ok"     : False,
        "smtp_ok"   : None,
    }

    # Layer 1 — Syntax
    if not check_syntax(email):
        result["reason"] = "❌ Invalid email format"
        return result
    result["syntax_ok"] = True

    # Layer 2 — MX Record
    mx_ok, mx_server = check_mx_record(email)
    if not mx_ok:
        result["reason"] = "❌ Domain has no mail server (domain may not exist)"
        return result
    result["mx_ok"] = True

    # Layer 3 — SMTP
    smtp_result = check_smtp(email, mx_server)

    if smtp_result is True:
        result["smtp_ok"] = True
        result["valid"]   = True
        result["reason"]  = "✅ Mailbox exists and is valid"

    elif smtp_result is False:
        result["smtp_ok"] = False
        result["valid"]   = False
        result["reason"]  = "❌ Mailbox does not exist"

    else:
        # Server blocked SMTP check (e.g. Gmail, Yahoo always block this)
        result["smtp_ok"] = None
        result["valid"]   = None
        result["reason"]  = "⚠️  Inconclusive — server blocked SMTP check (domain is real though)"

    return result

# ─── Bulk Verifier ────────────────────────────────────────────────────────────

def verify_bulk(emails, max_workers=5):
    """
    Verify a list of emails concurrently and return categorized results.

    Args:
        emails (list)      : list of email strings
        max_workers (int)  : parallel threads (keep low to avoid being flagged)

    Returns:
        dict with keys: valid, invalid, inconclusive
    """
    results     = {"valid": [], "invalid": [], "inconclusive": []}
    total       = len(emails)

    print(f"\n🔍 Verifying {total} email(s)...\n")
    print(f"{'Email':<35} {'Status'}")
    print("─" * 65)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(verify_email, email): email for email in emails}
        for future in as_completed(futures):
            r = future.result()
            print(f"{r['email']:<35} {r['reason']}")

            if r["valid"] is True:
                results["valid"].append(r["email"])
            elif r["valid"] is False:
                results["invalid"].append(r["email"])
            else:
                results["inconclusive"].append(r["email"])

    # ─── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "─" * 65)
    print(f"✅  Valid        : {len(results['valid'])}")
    print(f"❌  Invalid      : {len(results['invalid'])}")
    print(f"⚠️   Inconclusive : {len(results['inconclusive'])}")
    print(f"📊  Total        : {total}")
    print("─" * 65)

    return results

# ─── Integration with Your Cold Email Script ──────────────────────────────────

def send_verified_emails(sender_email, sender_password, recipients):
    """
    Verify all recipients first, then only send to valid/inconclusive ones.
    """
    emails = [p["email"] for p in recipients]

    # Verify all emails
    verified = verify_bulk(emails)

    # Filter recipients — skip invalid ones
    safe_emails = set(verified["valid"] + verified["inconclusive"])
    safe_recipients = [p for p in recipients if p["email"] in safe_emails]
    skipped         = [p for p in recipients if p["email"] not in safe_emails]

    if skipped:
        print(f"\n🚫 Skipping {len(skipped)} invalid email(s):")
        for p in skipped:
            print(f"   → {p['email']}")

    print(f"\n📤 Sending to {len(safe_recipients)} verified recipient(s)...\n")
    send_bulk_emails(sender_email, sender_password, safe_recipients)


# ─── Run ──────────────────────────────────────────────────────────────────────

RECIPIENTS = [
    {"name": "Alice",      "email": "alice@gmail.com",          "type": "friendly"},
    {"name": "Bob",        "email": "bob@fakedomain12345.com",   "type": "friendly"},
    {"name": "Dr. Smith",  "email": "drsmith@university.edu",   "type": "professional"},
    {"name": "Prof. Sara", "email": "notreal@nowhere.xyz",      "type": "professional"},
]

send_verified_emails(SENDER_EMAIL, SENDER_PASSWORD, RECIPIENTS)