#!/usr/bin/env python
# encoding: utf-8
"""
Loki Packaging Script

Created by Eric Naeseth on 2007-12-18.
Copyright (c) 2007 Carleton College. All rights reserved.
"""

import os
import sys
import loki
import tarfile
import re
import time
from optparse import OptionParser
from datetime import datetime

def main():
	parser = OptionParser(usage='%prog -v {loki version identifier}')
	parser.add_option('-v', '--version', dest='version',
		help='version identifier string used in building the package',
		metavar='VERSION')
	parser.add_option('-p', '--path', dest='path',
		help='the path to the Loki source directory', metavar='PATH',
		default=os.getenv('LOKI'))
	
	options, args = parser.parse_args()
	
	if not options.path:
		parser.error('please provide the path to Loki')
	if not options.version:
		parser.error('the build script requires you to explicitly identify ' +
			'the Loki version')
	
	script, mtime = compile_js(options.version, os.path.join(options.path, 'js'))
	
	# Build two tarballs; one distribution ball and one source ball.
	for source_build in (False, True):
		install_folder = 'loki-' + options.version
		if source_build:
			ball = install_folder + '-src.tar.bz2'
		else:
			ball = install_folder + '.tar.bz2'
		
		print ball
	
		if os.path.isfile(ball):
			os.remove(ball)
		tar = tarfile.open(ball, 'w:bz2')
	
		# Add the root installation folder
		root = tar.gettarinfo('.')
		root.name = install_folder
		root.type = tarfile.DIRTYPE
		root.mtime = time.time()
		tar.addfile(root)
	
		ball_pattern = re.compile('^loki-.+\.tar(\.(gz|bz2))?$')
		compiled_py_pattern = re.compile('\.pyc$')
	
		def add_recursive(base, logical_base):
			def acceptable(filename):
				if filename == 'svn':
					return False
				if not source_build and filename in ('js', 'tools'):
					return False
				if ball_pattern.match(filename):
					return False
				if compiled_py_pattern.search(filename):
					return False
			
				return True
		
			for filename in os.listdir(base):
				if acceptable(filename):
					path = os.path.join(base, filename)
					logical_path = os.path.join(logical_base, filename)
					tar.add(path, logical_path, False)
				
					if os.path.isdir(path):
						add_recursive(path, logical_path)
	
		add_recursive(options.path, install_folder)
		
		tar.add(script, install_folder + '/' + script)
		tar.close()
	
	# Clean up.
	os.remove(script)
	
def compile_js(version, js_path):
	"""Compiles the Loki JavaScript files into one big file."""
	
	f = file('loki.js', 'w')
	
	print >>f, '// Loki WYSIWIG Editor %s' % version
	print >>f, '// Copyright 2006 Carleton College'
	print >>f
	print >>f, '// Compiled %s' % datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')
	print >>f, '// http://loki-editor.googlecode.com'
	print >>f
	
	filenames, mtime = loki.get_source_filenames(js_path)
	
	for name in filenames:
		print >>f, "\n// file %s" % name
		src_file = open(os.path.join(js_path, name), 'rt')
		try:
			for line in src_file:
				print >>f, line,
		finally:
			src_file.close()
	
	f.close()
	return ('loki.js', mtime)
	
if __name__ == '__main__':
	main()