# Server setup

These are the steps used to set up the server that hosts the CHiMaD System Design Toolbox (`flask-app` branch). They are not a complete script; they are meant to be enough to rebuild or debug the server later.

## Overview

```
browser ──HTTPS──> nginx ──> gunicorn (127.0.0.1:5000) ──> Flask app (chimadApp/app/server.py)
                     │
                     └── serves chimadApp/app/static/ directly
```

- **OS:** RHEL 8 virtual machine (requested through Northwestern IT's server hosting request).
- **nginx** handles HTTPS, serves the static files, and only forwards the routes the app actually uses to gunicorn. Everything else is dropped.
- **gunicorn** runs the Flask app as a systemd service, listening only on localhost.
- **Data** are SQLite files in `chimadApp/app/static/data/sqlite3/` (`default.db`, `available_dbs.db`, `CHiMaD_metrics.db`, plus one `<groupname>.db` per group). nginx blocks web access to this folder.
- **Admin credentials** are in `chimadApp/app/private/access.csv` (hashed passwords). This file and the `.db` files are not in git (see `.gitignore`).

Paths below assume the repo is cloned into `/var/www/public`, so the app lives in `/var/www/public/CHiMaDSystemDesignToolbox/chimadApp/app`.

## 1. Request the VM

- Request a RHEL 8 VM through the NU IT server hosting form (2 vCPU and 4 GB memory is plenty; Network Zone: Web/DMZ).
- After the VM is created, NU's network team must open the firewall: SSH (from the NU network / VPN only) and HTTP/HTTPS (ports 80 and 443) from anywhere. This required separate tickets.
- Request the DNS name (`chimad-trainings.rcs.northwestern.edu`) to point at the VM.

## 2. Users and directories

As root:

```
useradd chimad                 # runs the app (gunicorn)
groupadd www
usermod -a -G www chimad
mkdir -p /var/www/public/logs  # nginx logs
chgrp -R www /var/www
chmod -R g+rwX /var/www
```

The user that runs gunicorn (`chimad`) must be able to write to the `sqlite3/` folder and to `private/access.csv`, since the app modifies them.

## 3. Python environment

As root, install Miniconda into `/usr/local/miniconda3`, and copy the `conda init` block from root's `.bashrc` into the `.bashrc` of the users that need it (e.g., `chimad`). Also `dnf install git`.

As `chimad`:

```
conda create --name chimad-env -c conda-forge python=3.10 flask sqlite pandas=1.5.3 gunicorn
```

The code uses `DataFrame.append` and `Series.iteritems`, which were removed in pandas 2, so keep pandas at 1.5.x unless the code is updated.

## 4. Code and data

```
cd /var/www/public
git clone -b flask-app https://github.com/ageller/CHiMaDSystemDesignToolbox.git
```

Then:

- Copy the `.db` files from a backup into `chimadApp/app/static/data/sqlite3/`.
- Create `chimadApp/app/private/access.csv` with columns `username,password,level`. `level` is `global` (full admin) or `group` (admin of the group with the same name). Passwords are stored as Werkzeug hashes; generate one with (prompts for the password so it doesn't end up in shell history):

  ```
  conda activate chimad-env
  python -c "import getpass; from werkzeug.security import generate_password_hash as g; print(g(getpass.getpass()))"
  ```

- `chimadApp/app/gunicorn_start.sh` must activate `chimad-env` (via the `conda init` block in `~/.bashrc` plus `conda activate chimad-env`, if needed) and bind gunicorn to `127.0.0.1:5000`. Do not bind to `0.0.0.0`; that would let people reach Flask directly and bypass nginx.

## 5. gunicorn service

As root, create `/etc/systemd/system/gunicorn.service`:

```
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=chimad
Group=www
WorkingDirectory=/var/www/public/CHiMaDSystemDesignToolbox/chimadApp/app
ExecStart=/var/www/public/CHiMaDSystemDesignToolbox/chimadApp/app/gunicorn_start.sh

[Install]
WantedBy=multi-user.target
```

## 6. HTTPS certificate

NU provides free SSL certificates (InCommon) through an NU IT service request. Generate a key and certificate signing request (CSR), and attach the `.csr` to the request:

```
openssl req -new -newkey rsa:2048 -nodes -keyout chimad-trainings.key -out chimad-trainings.csr
# Common Name: chimad-trainings.rcs.northwestern.edu
```

Download the certificate ("Certificate (w/ issuer after), PEM encoded") and, as root, put the files where nginx expects them:

```
cp chimad-trainings_rcs_northwestern_edu.pem /etc/ssl/certs/
cp chimad-trainings.key /etc/ssl/private/
```

The certificate lasts about 13 months and must be renewed each year (it has been renewed each April). Renew through the same NU IT service, replace the `.pem`, and reload nginx.

## 7. nginx

As root, `dnf install nginx`. Then:

- Create `/etc/nginx/sites-available/` and `/etc/nginx/sites-enabled/`.
- In `/etc/nginx/nginx.conf`, remove the default `server { }` block and add `include /etc/nginx/sites-enabled/*;` at the end of the `http { }` block.
- Create `/etc/nginx/sites-available/chimad-trainings.conf` (below) and symlink it into `sites-enabled/`.

```nginx
server {
        listen 80;
        server_name chimad-trainings.rcs.northwestern.edu www.chimad-trainings.rcs.northwestern.edu;
        return 301 https://$host$request_uri;
}

server {
        listen 443 ssl;
        server_name chimad-trainings.rcs.northwestern.edu www.chimad-trainings.rcs.northwestern.edu;

        ssl_certificate /etc/ssl/certs/chimad-trainings_rcs_northwestern_edu.pem;
        ssl_certificate_key  /etc/ssl/private/chimad-trainings.key;
        ssl_protocols TLSv1.2 TLSv1.3;

        server_tokens off;

        access_log /var/www/public/logs/nginx-access.log;
        error_log /var/www/public/logs/nginx-error.log;

        # proxy settings shared by the two app locations below
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Pages and downloads: GET/HEAD only
        location ~ ^/(home|index|training|editPara|editSDC|about|documentation|admin|admin_logout|download_metricsSQL|download_metricsCSV|download_groupSQL|download_paragraphCSV)?$ {
            limit_except GET { deny all; }
            proxy_pass http://127.0.0.1:5000;
        }

        # Data endpoints called by the site's JavaScript: POST only
        location ~ ^/(load_table|save_responses|save_metrics|get_table_names|check_user_submitted|add_new_groupname|delete_groupname|rename_groupname|delete_paragraph|rename_paragraph|delete_paragraph_rows|set_paragraph_answers|copy_paragraph|get_group_admins|add_group_admin|remove_group_admin|set_group_adminPW)$ {
            limit_except POST { deny all; }
            proxy_pass http://127.0.0.1:5000;
        }

        # Never serve the databases or helper scripts
        location ^~ /static/data/ {
            return 403;
        }

        # Static assets, served by nginx directly (the trailing slashes matter)
        location ^~ /static/ {
            limit_except GET { deny all; }
            alias /var/www/public/CHiMaDSystemDesignToolbox/chimadApp/app/static/;
            expires 30d;
        }

        location = /favicon.ico {
            access_log off;
            return 204;
        }

        # Everything else (bot probes): close the connection, don't log
        location / {
            access_log off;
            return 444;
        }
}
```

**If you add a new route to `server.py`, add it to the matching `location` list above**, or nginx will drop requests to it. Also keep the trailing slashes on `location ^~ /static/` and its `alias`; without them, requests like `/static../server.py` can read files outside `static/`.

## 8. Start the services

As root:

```
systemctl enable --now gunicorn
nginx -t
systemctl enable --now nginx

systemctl status gunicorn
systemctl status nginx
```

## Deploying updates

As the user that owns the repo:

```
cd /var/www/public/CHiMaDSystemDesignToolbox
git pull
```

If `git pull` complains about local changes (e.g., a server-specific `gunicorn_start.sh`):

```
git stash
git pull
git stash pop
```

Then restart:

```
sudo systemctl restart gunicorn
sudo systemctl reload nginx     # only needed if the nginx config changed
```

Quick checks (expected results in comments):

```
B=https://chimad-trainings.rcs.northwestern.edu
curl -sI $B/ | head -1                                       # 200
curl -sI $B/static/js/utils.js | head -1                     # 200
curl -sI $B/static/data/sqlite3/available_dbs.db | head -1   # 403
curl -sI $B/load_table | head -1                             # 403 (GET not allowed)
curl -sI --path-as-is $B/static../server.py | head -1        # not 200
```

## Backups

The data are only the `.db` files and `private/access.csv`. Copy them off the server regularly, and before any major change:

```
scp <user>@<server>:/var/www/public/CHiMaDSystemDesignToolbox/chimadApp/app/static/data/sqlite3/*.db .
```

## Routine maintenance

A few times a year:

1. **OS security updates** (as a sudo user):
   ```
   sudo dnf updateinfo list security
   sudo dnf update --security
   ```
2. **nginx:** if `nginx -v` changed, run `sudo nginx -t && sudo systemctl reload nginx`.
3. **Python packages** (as `chimad`, in `chimad-env`). The security-relevant ones are `openssl`, `ca-certificates`, `gunicorn`, `flask` and `werkzeug`:
   ```
   conda update --dry-run openssl ca-certificates gunicorn flask werkzeug
   conda update openssl ca-certificates gunicorn flask werkzeug
   sudo systemctl restart gunicorn
   ```
4. **Reboot if needed** (`needs-restarting` is in `dnf-utils`):
   ```
   sudo needs-restarting -r
   ```
   Before rebooting, check that nobody is using the site (`who`, `sudo tail /var/www/public/logs/nginx-access.log`, `sudo lsof -iTCP:443 -sTCP:ESTABLISHED`). After rebooting, confirm `systemctl status nginx gunicorn` and rerun `needs-restarting -r`.
5. **SSL certificate:** renew yearly (see step 6).
