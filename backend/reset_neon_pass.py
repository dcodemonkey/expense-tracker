"""Reset user password directly in Neon cloud database using psycopg2."""
import bcrypt
import psycopg2

# Neon DB connection (sync psycopg2)
NEON_URL = "postgresql://neondb_owner:npg_6xuvKEZpQTU0@ep-summer-dream-azp1gfwh.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

NEW_PASSWORD = "12345678"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password[:72].encode(), bcrypt.gensalt(12)).decode()

conn = psycopg2.connect(NEON_URL)
cur = conn.cursor()

# Get all users
cur.execute("SELECT id, email FROM users;")
users = cur.fetchall()
print(f"Found {len(users)} user(s): {[u[1] for u in users]}")

new_hash = hash_password(NEW_PASSWORD)

# Reset all passwords
cur.execute("UPDATE users SET hashed_password = %s;", (new_hash,))
conn.commit()
print(f"SUCCESS: Reset password to '{NEW_PASSWORD}' for {cur.rowcount} user(s)")

cur.close()
conn.close()
