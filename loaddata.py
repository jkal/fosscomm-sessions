#!/usr/bin/env python
import sys, redis, json

r = redis.Redis()

with open(sys.argv[1]) as f:
    for session in json.loads(f.read()):
        r.hset('fosscomm2011:sessions:all', session['id'], json.dumps(session))