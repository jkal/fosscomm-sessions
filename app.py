#!/usr/bin/env python
from flask import Flask, render_template
import json
import redis

app = Flask(__name__)
db = redis.Redis()

app.url_map.strict_slashes = False

@app.route('/')
def index():
    current = dict((k, json.loads(v)) for k, v in db.hgetall('fosscomm2011:sessions:current').items())
    return render_template('index.html', sessions=current)

@app.route('/display')
def display():
    current = dict((k, json.loads(v)) for k, v in db.hgetall('fosscomm2011:sessions:current').items())
    return render_template('display.html', sessions=current)

@app.route('/admin')
def admin():
    all = dict((k, json.loads(v)) for k, v in db.hgetall('fosscomm2011:sessions:all').items())
    current = dict((k, json.loads(v)) for k, v in db.hgetall('fosscomm2011:sessions:current').items())
    return render_template('admin.html', sessions=all, current=current)

if __name__ == "__main__":
    app.run()