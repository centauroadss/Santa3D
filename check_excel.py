import pandas as pd

try:
    df = pd.read_excel('C:\\Users\\joaou\\OneDrive\\Documentos\\Tabla historica TC OFICIAL BCV.xlsx')
    print("Filas en el Excel:", len(df))
    print(df.head(20))
except Exception as e:
    print("Error:", e)
