require 'rake'
require 'rake/packagetask'
require 'rake/clean'

LOKI_PATH = File.expand_path(File.dirname(__FILE__))
LOKI_LIB = File.join(LOKI_PATH, 'lib')
LOKI_SRC = File.join(LOKI_PATH, 'src')
LOKI_DOCS = File.join(LOKI_PATH, 'docs')
LOKI_BUILD = File.join(LOKI_PATH, 'build')
LOKI_PKG = File.join(LOKI_PATH, 'pkg')
LOKI_VER = '3.0a1'

src_files = FileList.new(File.join(LOKI_SRC, '**', '*.js'))

task :default => [:script]

task :script => ["build/loki.js"]

CLEAN.include('build/loki.js')
CLOBBER.include('build', 'pkg', 'docs', 'private')

file "build/loki.js" => src_files do |t|
  FileUtils::mkdir LOKI_BUILD if !File.directory?(LOKI_BUILD)
  infile = File.join(LOKI_SRC, 'loki.js')
  outfile = File.join(LOKI_BUILD, 'loki.js')
  sh %Q{cpp -undef -P -I#{LOKI_LIB} -DLOKI_VERSION=\\"#{LOKI_VER}\\" "#{infile}" "#{outfile}"}
end

task :docs => src_files do
  FileUtils::mkdir LOKI_DOCS if !File.directory?(LOKI_DOCS)
  if !ENV.has_key?("NATURAL_DOCS")
    raise 'to build documentation, define the "NATURAL_DOCS" environment ' +
      'variable with the path to Natural Docs 1.4'
  end
  
  nd_path = ENV["NATURAL_DOCS"]
  nd_path = File.join(nd_path, 'NaturalDocs') if File.directory?(nd_path)
  scratch = File.join(LOKI_PATH, 'private')
  FileUtils::mkdir scratch if !File.directory?(scratch)
  
  sh %Q{#{nd_path} -i #{LOKI_SRC} -o HTML #{LOKI_DOCS} -p #{scratch}}
end

Rake::PackageTask.new('loki', (ENV['version'] or LOKI_VER)) do |package|
  package.need_zip = package.need_tar_bz2 = true
  package.package_dir = LOKI_PKG
  package.package_files.include(
    'auxil/**',
    'css/**',
    'images/**',
    'build/loki.js',
    'license.txt',
    'readme.txt',
    'tests/**'
  )
end

Rake::PackageTask.new('loki-src', (ENV['version'] or LOKI_VER)) do |package|
  package.need_tar_bz2 = true
  package.package_dir = LOKI_PKG
  package.package_files.include(
    'auxil/**',
    'css/**',
    'images/**',
    'build/loki.js',
    'license.txt',
    'readme.txt',
    'src',
    'tests/**'
  )
end

task :package => [:script]
