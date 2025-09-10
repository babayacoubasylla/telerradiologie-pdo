# create_admin.py
import sqlite3
from werkzeug.security import generate_password_hash

# Connexion à la base de données
conn = sqlite3.connect('database.db')
c = conn.cursor()

# Créer un utilisateur admin
email = "admin@clinique.com"
password = generate_password_hash("Clinique123!")
full_name = "Administrateur Clinique"
role = "admin"

c.execute("""
    INSERT INTO users (email, password, full_name, role)
    VALUES (?, ?, ?, ?)
""", (email, password, full_name, role))

conn.commit()
conn.close()

print("✅ Admin créé avec succès !")
print(f"Email: {email}")
print(f"Mot de passe: Clinique123!")