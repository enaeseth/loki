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
	parser.add_option('-d', '--with-dist', dest='dist_build', action='store_true',
		help='build a distribution tarball (default: true)')
	parser.add_option('-s', '--with-source', dest='source_build',
		action='store_true', help='build a source tarball (default: false)')
	parser.add_option('-j', '--js-only', dest='js_only', action='store_true',
		help='instead of building tarballs, outputs a compiled loki.js file ' +
		'to standard output')
	parser.add_option('--distribute-tests', dest='distribute_tests',
	  action='store_true', help='include tests with in distribution tarball')
	parser.add_option('-D', '--without-dist', dest='dist_build',
		action='store_false')
	parser.add_option('-S', '--without-source', dest='dist_build',
		action='store_false')
	
	parser.set_defaults(path=os.getenv('LOKI'), dist_build=True,
		source_build=False, js_only=False, distribute_tests=False)
	
	options, args = parser.parse_args()
	
	if not options.path:
		parser.error('please provide the path to Loki')
	if not options.version:
		parser.error('the build script requires you to explicitly identify ' +
			'the Loki version')
			
	if options.js_only:
		compile_js(options.version, os.path.join(options.path, 'js'),
			sys.stdout)
		return
	
	script, mtime = compile_js(options.version, os.path.join(options.path, 'js'))
	
	# Figure out which tarballs should be built.
	builds = []
	if options.dist_build:
		builds.append(False)
	if options.source_build:
		builds.append(True)
	
	for source_build in builds:
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
				if filename[0] == '.':
					return False
				if not source_build:
					if filename in ('js', 'tools'):
						return False
					elif filename == 'tests' and not options.distribute_tests:
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
	
def compile_js(version, js_path, outfile=None):
	"""Compiles the Loki JavaScript files into one big file."""
	
	f = outfile or file('loki.js', 'w')
	
	print >>f, '// Loki WYSIWIG Editor %s' % version
	print >>f, '// Copyright (c) 2006 Carleton College'
	print >>f
	print >>f, '// Compiled %s' % datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')
	print >>f, '// http://loki-editor.googlecode.com/'
	print >>f
	
	filenames, mtime = loki.get_source_filenames(js_path)
	
	for name in filenames:
		print >>f, "\n// file %s" % name
		src_file = open(os.path.join(js_path, name), 'rt')
		try:
			for line in src_file:
				if name == 'UI.Loki.js':
					print >>f, re.sub('\$Rev[^\$]*\$', version, line),
				else:
					print >>f, line,
		finally:
			src_file.close()
	
	if not outfile:
		f.close()
		return ('loki.js', mtime)
		
	return mtime
	
if __name__ == '__main__':
	main()