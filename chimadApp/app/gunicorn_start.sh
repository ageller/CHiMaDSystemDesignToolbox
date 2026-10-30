#!/bin/bash

source /home/chimad/.bashrc

gunicorn server:app --workers 1 --bind 127.0.0.1:5000
