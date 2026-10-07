@echo off
title SmartTriage AI - Dashboard
echo Starting SmartTriage AI Dashboard on http://localhost:8501 ...

if exist .venv\Scripts\streamlit.exe (
    echo Using virtual environment: .venv
    .venv\Scripts\streamlit.exe run app.py
) else (
    streamlit run app.py
)
pause
