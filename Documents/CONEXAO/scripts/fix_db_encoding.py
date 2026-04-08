import psycopg2
import json

def fix_encodings():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5434",
            user="admin",
            password="password123",
            database="conext_db"
        )
        cur = conn.cursor()

        # Update descriptions with correct strings
        updates = [
            ('writer-basic', 'Ideal para blogs pequenos e iniciantes no Marketing de Conteúdo.'),
            ('writer-pro', 'Para criadores profissionais e sites de autoridade que precisam de volume.'),
            ('writer-elite', 'Poder total para redes de sites, agências e portais de notícias.')
        ]

        for plan_id, desc in updates:
            cur.execute("UPDATE \"Plan\" SET description = %s WHERE id = %s", (desc, plan_id))

        # Fix features JSONB
        cur.execute("SELECT id, features FROM \"Plan\" WHERE type = 'WRITER_PLUGIN'")
        rows = cur.fetchall()
        for row in rows:
            plan_id, features = row
            if isinstance(features, list):
                new_features = []
                for f in features:
                    text = f.get('text', '')
                    # This python script is UTF-8 so this should work
                    new_features.append(f)
                
                cur.execute("UPDATE \"Plan\" SET features = %s WHERE id = %s", (json.dumps(features), plan_id))

        conn.commit()
        cur.close()
        conn.close()
        print("Successfully fixed encodings in database.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_encodings()
