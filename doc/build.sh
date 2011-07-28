#!/bin/bash
cd `dirname $0`
dox --title 'Rain Documentation' ../lib/*.js > index.html
