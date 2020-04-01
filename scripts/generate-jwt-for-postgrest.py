#!/usr/bin/env python3
# required pyjwt
import jwt
import os
import time
import sys
import secrets


def generate_secret(nbytes=32):
    return secrets.token_urlsafe(nbytes)


arg1 = sys.argv[1] if len(sys.argv) > 1 else None
arg2 = sys.argv[2] if len(sys.argv) > 2 else None

print(f'Generate JWT token which can be used with postgrest api.')
if arg1 == '--help':
    print(f'Usage: {os.path.basename(__file__)} [secret] [role]')
    print(f'You can use system environment variable JWT_SECRET to provide seccret')
    print(f'Default "role" values is "api_user"')
    sys.exit(1)

jwt_secret = arg1 or os.environ.get('JWT_SECRET', generate_secret(32))
payload = {"role": arg2 or 'api_user'}
jwt_token = jwt.encode(payload, jwt_secret, algorithm='HS256')
res_token = jwt_token.decode('utf-8')
print(f'Payload : {payload}')
if jwt_secret != arg1:
    print(f'Secret  : {jwt_secret}')
print(f'JWTToken:  {res_token}')
