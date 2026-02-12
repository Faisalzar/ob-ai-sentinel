"""
Generate secure SECRET_KEY and ENCRYPTION_KEY for .env file
"""
import secrets
import base64

print("=" * 60)
print("Security Keys Generator for AI Object Detection Backend")
print("=" * 60)
print()

# Generate SECRET_KEY (for JWT tokens)
secret_key = secrets.token_urlsafe(32)
print("SECRET_KEY (for JWT):")
print(secret_key)
print()

# Generate ENCRYPTION_KEY (for AES-256-GCM, needs to be 32 bytes)
encryption_key_bytes = secrets.token_bytes(32)
encryption_key = base64.b64encode(encryption_key_bytes).decode()
print("ENCRYPTION_KEY (for AES-256-GCM):")
print(encryption_key)
print()

print("=" * 60)
print("Copy these keys to your .env file:")
print("=" * 60)
print(f"SECRET_KEY={secret_key}")
print(f"ENCRYPTION_KEY={encryption_key}")
print()

print("⚠️  IMPORTANT: Keep these keys secret and never commit them to git!")
