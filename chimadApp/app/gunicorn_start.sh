#!/bin/bash

source /home/chimad/.bashrc

gunicorn server:app --workers 1 --bind 0.0.0.0:5000 --reload
