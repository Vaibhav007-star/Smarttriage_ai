@echo off
title SmartTriage AI - GPU Training
echo Running SmartTriage AI GPU Model Trainer on NVIDIA GPU ...

if exist .venv\Scripts\python.exe (
    echo Using virtual environment: .venv
    .venv\Scripts\python.exe train.py
) else (
    python train.py
)
pause
