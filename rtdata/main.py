import subprocess
import sys
import os
import GLOBAL.GLOVAR as GLOVAR

os_type = os.name

if os_type == "nt":
    print("You are using Windows.")
    python_venv = ".venv/Scripts/python.exe"
    process = ["start", "cmd", "/k"]
elif os_type == "posix":
    # Further check for macOS or Linux
    if os.uname().sysname == "Darwin":
        print("You are using macOS.")
    else:
        print("You are using Linux.")
        python_venv = ".venv/bin/python"
        process = ["gnome-terminal", "--", "bash", "-c", ]
else:
    print("Unknown operating system.")
    python_venv = ".venv/bin/python"

py = os.path.join(GLOVAR.PATH_CURRENT, python_venv)
scripts = ['rt_sec_5.py','rt_min_1.py', 'rt_ti_min_1.py', 'rt_om.py']
for script in scripts:
    command = f"{py} {script}"
    subp = process.copy()
    subp.append(command)
    print(subp)
    subprocess.Popen(subp, shell=True)