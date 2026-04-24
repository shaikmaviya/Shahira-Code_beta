import subprocess
import schedule
import time
from datetime import datetime

# ─── CONFIG ───────────────────────────────────────────
REPO_PATH = r"C:\Users\black\OneDrive\Desktop\Shahira Code"  # Change to your project path if needed
REMOTE = "origin"
BRANCH = "main"
# ──────────────────────────────────────────────────────

def run_command(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=REPO_PATH)
    if result.returncode != 0:
        print(f"❌ Error: {result.stderr.strip()}")
    else:
        print(f"✅ {result.stdout.strip()}")
    return result.returncode

def auto_commit_push():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n🔄 Running auto commit at {now}")

    # Check if there are changes
    status = subprocess.run("git status --porcelain", shell=True, capture_output=True, text=True, cwd=REPO_PATH)
    
    if not status.stdout.strip():
        print("ℹ️  No changes to commit.")
        return

    # Stage all changes
    run_command("git add .")

    # Commit with timestamp
    commit_message = f"Auto commit - {now}"
    run_command(f'git commit -m "{commit_message}"')

    # Push to GitHub
    code = run_command(f"git push {REMOTE} {BRANCH}")
    
    if code == 0:
        print(f"🚀 Successfully pushed to {REMOTE}/{BRANCH}")
    else:
        print("❌ Push failed. Check your credentials or internet connection.")

# ─── RUN IMMEDIATELY + SCHEDULE EVERY 30 MINS ─────────
if __name__ == "__main__":
    print("⚙️  Auto Git Push Started...")
    print(f"📁 Repo Path : {REPO_PATH}")
    print(f"🌿 Branch    : {BRANCH}")
    print(f"☁️  Remote    : {REMOTE}")
    print("─" * 60)

    # Run once immediately
    auto_commit_push()

    # Then run every 30 minutes
    schedule.every(30).minutes.do(auto_commit_push)

    while True:
        schedule.run_pending()
        time.sleep(1)