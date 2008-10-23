require 'rake'
require 'rake/packagetask'
require 'rake/clean'

LOKI_PATH = File.expand_path(File.dirname(__FILE__))
LOKI_LIB = File.join(LOKI_PATH, 'lib')
LOKI_SRC = File.join(LOKI_PATH, 'src')
LOKI_DOCS = File.join(LOKI_PATH, 'docs')
LOKI_BUILD = File.join(LOKI_PATH, 'build')
LOKI_PKG = File.join(LOKI_PATH, 'pkg')
LOKI_PLUGINS = File.join(LOKI_PATH, 'plugins')
LOKI_VER = '3.0a1'

require File.join(LOKI_PATH, "treetop", "strings_nodes")
require File.join(LOKI_PATH, "treetop", "strings")

src_files = FileList.new(File.join(LOKI_SRC, '**', '*.js'))

task :default => [:script]

desc "Compiles the Loki JavaScript file (including available plugins)."
task :script => ["build/loki.js"]

CLEAN.include('build/loki.js', 'build/core.js', 'build/plugins.js')
CLOBBER.include('build', 'pkg', 'docs', 'private')

# Rule for compiling .strings files to JavaScript.
rule(/\.strings.js$/ => [
    proc {|task_name| task_name.sub(/\.[^.]+$/, '') }
]) do |t|
  if RakeFileUtils.verbose_flag == :default
    verbose = false
  else
    verbose ||= RakeFileUtils.verbose_flag
  end
  puts "compiling #{t.source}" if verbose
  parser = StringsParser.new
  ast = parser.parse(File.read(t.source))
  strings = ast.strings
  locale = File.basename(t.source).sub(/\.strings$/, '')
  
  File.open(t.name, "w") do |f|
    f.puts("/* Automatically-generated localized strings file */", "")
    f.puts("Loki.Locale.get(#{locale.inspect}).setStrings({")
    
    keys = strings.keys.sort
    end_i = keys.length - 1
    keys.each_with_index do |key, i|
      sep = (i < end_i) ? "," : ""
      f.puts("\t#{key.inspect}: #{strings[key].inspect}#{sep}")
    end
    f.puts("});")
  end
end

def compile_js(infile, outfile)
  sh %Q{cpp -undef -P -I#{LOKI_LIB} -DLOKI_VERSION=\\"#{LOKI_VER}\\" "#{infile}" "#{outfile}"}
end

# Find all plugins and add the appropriate tasks.
plugin_tasks = []
FileList[File.join(LOKI_PLUGINS, '*')].map do |path|
  plugin = File.basename(path)
  task_name = plugin.to_sym
  plugin_tasks.push task_name
  outfile = "build/plugin_#{plugin}.js"
  
  desc %Q{Compiles the "#{plugin}" plugin.}
  task task_name => [outfile]
  
  strings = FileList["plugins/#{plugin}/strings/*.strings"].map { |f|
    f.sub(/\.strings$/, ".strings.js")
  }
  
  file outfile => ["plugins/#{plugin}/#{plugin}.js"]
  file outfile => strings
  CLEAN.include(strings)
  
  file outfile do
    compile_js "plugins/#{plugin}/#{plugin}.js", outfile
    ["en", "en-US"].each do |locale|
      filename = File.join(LOKI_PLUGINS,
        "#{plugin}/strings/#{locale}.strings.js")
      if File.file?(filename)
        sh %Q{cat "#{filename}" >> #{outfile}}
      end
    end
  end
end

file "build/loki.js" => ["build/core.js", "build/plugins.js"] do |t|
  core = File.join(LOKI_BUILD, 'core.js')
  plugins = File.join(LOKI_BUILD, 'plugins.js')
  sh %Q{cat "#{core}" "#{plugins}" > "#{t.name}"}
end

file "build/core.js" => src_files do |t|
  FileUtils::mkdir LOKI_BUILD if !File.directory?(LOKI_BUILD)
  infile = File.join(LOKI_SRC, 'loki.js')
  compile_js infile, t.name
end

file "build/plugins.js" => plugin_tasks do |t|
  FileUtils::mkdir LOKI_BUILD if !File.directory?(LOKI_BUILD)
  plugin_files = plugin_tasks.map {|s| "build/plugin_#{s.to_s}.js".inspect }.join(" ")
  sh %Q{cat #{plugin_files} > #{t.name}}
end

desc "Generates API documentation (requires NaturalDocs 1.4)."
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
