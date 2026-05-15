import FinanceDataReader as fdr

def get_stock_list():
    pass    

def get_stock_by_code(code: str):
    df = fdr.DataReader(code, '2026')
    

    return type("Stock", (object,), {
        
    })