import subprocess
from datetime import datetime
from pathlib import Path

# ---- CONFIG -------------------------------------------------
BACKEND_PATH = Path(r"C:\Users\black\OneDrive\Desktop\Shahira Code\shahira-code")
REMOTE_NAME = "origin"
REMOTE_URL = "https://github.com/shaikmaviya/shahira-code-backend.git"
BRANCH = "main"
# ------------------------------------------------------------


def run(command, cwd=BACKEND_PATH):
    result = subprocess.run(
        command,
        shell=True,
        capture_output=True,
        text=True,
        cwd=str(cwd),
    )
    if result.returncode != 0:
        print(f"❌ {command}\n{result.stderr.strip()}")
    else:
        stdout = result.stdout.strip()
        if stdout:
            print(stdout)
    return result


def ensure_git_repo():
    if (BACKEND_PATH / ".git").exists():
        return
    run("git init")


def ensure_remote():
    remotes = run("git remote").stdout.split()
    if REMOTE_NAME in remotes:
        run(f"git remote set-url {REMOTE_NAME} {REMOTE_URL}")
    else:
        run(f"git remote add {REMOTE_NAME} {REMOTE_URL}")


def ensure_branch():
    run(f"git checkout -B {BRANCH}")


def commit_and_push():
    status = run("git status --porcelain")
    if not status.stdout.strip():
        print("ℹ️  No changes to commit.")
        return

    run("git add .")
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    run(f'git commit -m "Backend commit - {now}"')
    run(f"git push -u {REMOTE_NAME} {BRANCH}")


if __name__ == "__main__":
    if not BACKEND_PATH.exists():
        raise SystemExit(f"Backend path not found: {BACKEND_PATH}")

    ensure_git_repo()
    ensure_remote()
    ensure_branch()
    commit_and_push()
