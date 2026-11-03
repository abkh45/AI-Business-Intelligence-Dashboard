from database import engine

try:
    with engine.connect() as connection:
        print("Supabase Connection Successful!")

except Exception as e:
    print("Supabase Connection Failed")
    print(e)