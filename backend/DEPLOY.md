Steps to finish deployment and secure secrets:

1) Rotate exposed DB credentials
- Create a new master/user password in the RDS console or create a new DB user with a strong password.
- Update any apps/users that relied on the old secret.

2) Remove secrets from the repo (fast):
- Stop tracking local .env and commit:
  git rm --cached backend/.env
  git commit -m "remove .env from repo"
  git push

3) Purge secrets from history (recommended if secret was pushed):
- Using BFG (easy):
  bfg --delete-files backend/.env
  git reflog expire --expire=now --all && git gc --prune=now --aggressive
  git push --force
- Or git-filter-repo (preferred for complex needs). Install and follow docs.

4) Place the real .env on the EC2 host (do NOT commit):
- scp /local/path/.env ec2-user@<EC2_IP>:/home/ec2-user/Featherstill-Capstone-Project/backend/.env
- Ensure permissions:
  chmod 600 /home/ec2-user/Featherstill-Capstone-Project/backend/.env
  chown ec2-user:ec2-user /home/ec2-user/Featherstill-Capstone-Project/backend/.env

5) Install and enable systemd unit (if using systemd):
- Copy systemd/backend.service to /etc/systemd/system/backend.service
- Reload and start:
  sudo systemctl daemon-reload
  sudo systemctl enable backend.service
  sudo systemctl start backend.service
  sudo journalctl -u backend.service -f

6) Quick connectivity test from EC2:
- Install psql client if needed (amazon-linux: sudo yum install -y postgresql)
- Test:
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" -d "$DB_NAME" -c '\l'

7) Verify application logs:
- Look for: "[Database] PostgreSQL connected to ..." in the backend logs.
