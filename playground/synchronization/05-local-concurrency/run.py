#!/usr/bin/env python3
"""Compile into a disposable directory; never change Java installation/configuration."""
import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile

parser=argparse.ArgumentParser()
parser.add_argument('--jdk',type=Path,help='JDK root with bin/java and bin/javac')
args=parser.parse_args()
root=Path(__file__).resolve().parent
java=str(args.jdk/'bin/java') if args.jdk else shutil.which('java')
javac=str(args.jdk/'bin/javac') if args.jdk else shutil.which('javac')
if not java or not javac:parser.error('Install/select a JDK or supply --jdk')
with tempfile.TemporaryDirectory(prefix='sync-java-concurrency-') as build:
    subprocess.run([java,'-version'],check=True,timeout=15)
    subprocess.run([javac,'--release','17','-d',build,str(root/'ConcurrencyLab.java')],check=True,timeout=30)
    subprocess.run([java,'-cp',build,'ConcurrencyLab'],check=True,timeout=60)
    values=[subprocess.check_output([java,'-cp',build,'ConcurrencyLab','process-counter'],text=True,timeout=15).strip() for _ in range(2)]
    if values!=['1','1']:raise AssertionError(values)
    print('PASS two JVMs each increment their own local counter to 1')
    print('Java validation: 20 in-process scenarios + 1 process-boundary scenario passed')
