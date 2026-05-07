import subprocess
import webbrowser
import threading
import sys
import os
import signal
import time
import shutil
from datetime import datetime

processes = {}
lock = threading.Lock()

COLORS = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "green": "\033[92m",
    "blue": "\033[94m",
    "yellow": "\033[93m",
    "red": "\033[91m",
    "cyan": "\033[96m",
    "magenta": "\033[95m",
    "dim": "\033[2m",
}

def c(color, text):
    return f"{COLORS.get(color, '')}{text}{COLORS['reset']}"

def timestamp():
    return c("dim", datetime.now().strftime("%H:%M:%S"))

def stream_output(process, label, color):
    prefix = c(color, f"[{label}]")
    if not process.stdout:
        return

    for line in iter(process.stdout.readline, ""):
        decoded = line.rstrip()
        if decoded:
            print(f"{timestamp()} {prefix} {decoded}")

def launch(name, cmd, cwd=None):
    print(f"\n{timestamp()} {c('bold', f'Starting {name}...')}")
    print(f"  {c('dim', '> ' + ' '.join(cmd))}\n")
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=cwd or os.getcwd(),
            shell=False,
        )
        with lock:
            processes[name] = proc
        thread = threading.Thread(target=stream_output, args=(proc, name, "green" if name == "Frontend" else "blue"), daemon=True)
        thread.start()
        return proc
    except FileNotFoundError as e:
        print(c("red", f"  ERROR: Could not start {name}: {e}"))
        return None

def shutdown(signum=None, frame=None):
    print(f"\n\n{c('yellow', 'Shutting down all processes...')}")
    with lock:
        for name, proc in processes.items():
            if proc and proc.poll() is None:
                print(f"  {c('dim', f'Stopping {name}...')}")
                proc.terminate()
    time.sleep(1)
    with lock:
        for name, proc in processes.items():
            if proc and proc.poll() is None:
                proc.kill()
    print(c("green", "All processes stopped. Goodbye!"))
    sys.exit(0)

def get_npm_command():
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    resolved = shutil.which(npm_cmd) or npm_cmd
    return [resolved, "run", "dev"]

def get_mvn_command():
    if sys.platform == "win32":
        return ["mvnw.cmd", "spring-boot:run"]
    return ["./mvnw", "spring-boot:run"]

def print_banner():
    print(c("cyan", """
╔══════════════════════════════════════╗
║        Dev Launcher  v1.0            ║
║  Frontend  +  Spring Boot Backend    ║
╚══════════════════════════════════════╝"""))
    print(c("dim", "  Press Ctrl+C to stop all services\n"))

def wait_for_processes():
    while True:
        time.sleep(1)
        with lock:
            all_dead = all(
                proc is None or proc.poll() is not None
                for proc in processes.values()
            )
        if all_dead and processes:
            print(c("yellow", "\nAll processes have exited."))
            break

def main():
    print_banner()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    frontend_dir = sys.argv[1] if len(sys.argv) >= 2 else os.getcwd()
    backend_dir = sys.argv[2] if len(sys.argv) >= 3 else os.path.join(os.getcwd(), "shahira-code")

    if frontend_dir and not os.path.isdir(frontend_dir):
        print(c("red", f"  ERROR: Frontend directory not found: {frontend_dir}"))
        sys.exit(1)

    if not os.path.isdir(backend_dir):
        print(c("red", f"  ERROR: Backend directory not found: {backend_dir}"))
        sys.exit(1)

    frontend_proc = launch("Frontend", get_npm_command(), cwd=frontend_dir)
    print(f"{timestamp()} {c('cyan', 'Opening browser in 3 seconds...')}")
    time.sleep(3)
    webbrowser.open("http://localhost:5173/")
    time.sleep(1)
    backend_proc = launch("Backend", get_mvn_command(), cwd=backend_dir)

    if not frontend_proc and not backend_proc:
        print(c("red", "\nFailed to start any processes. Exiting."))
        sys.exit(1)

    print(f"\n{c('green', 'Both services launched!')} {c('dim', '(Ctrl+C to stop)')}\n")
    print(c("dim", "─" * 50))

    wait_for_processes()

if __name__ == "__main__":
    main()