require 'rake'
require 'rake/clean'
require 'yaml'
require 'json'
begin
  require 'sass'
rescue LoadError
  raise 'Sass (a part of the Haml library) is required to build Loki.'
end

# Bootstrap.
LOKI_PATH = File.expand_path(File.dirname(__FILE__))
require File.join(LOKI_PATH, 'lib', 'build')

paths = Loki::Paths.instance # shorthand
CLOBBER.include ['build', 'pkg']

# Which locales should have their strings inlined?
INLINE_LOCALES = ['en', 'en-US'] | (ENV['INLINE_LOCALES'] || '').split(/[^a-zA-Z-]+/)

task :default => [:build]
desc "Build the Loki environment."
task :build => [:base2, :themes, :plugins, :core, paths.build('loki.js')]

file paths.build('loki.js') => [:plugins, :core] do |t|
  files = [paths.build('core.js')] + Loki.plugins.map {|n| paths.build('plugins', n, "#{n}.js")}
  File.open(t.name, 'w') do |f|
    files.each {|filename| f.puts File.read(filename); f.puts}
  end
end

CLEAN.include paths.build('core.js')
file paths.build('core.js') => FileList.new(paths.src('**', '*.js')) do |t|
  compile_js paths.src('loki.js') => t.name
end
desc "Build the Loki core files."
task :core => [paths.build('core.js')]

CLEAN.include paths.build('plugins')
desc "Build all plugins."
task :plugins

namespace :plugins do
  Loki.plugins.each do |plugin|
    dest = paths.build('plugins', plugin)
    desc "Build the '#{plugin}' plugin."
    t = task(plugin)
    
    file dest do
      mkdir? paths.build('plugins')
      mkdir? dest
    end
    
    # Strings files.
    inline_string_files = []
    if File.directory?(paths.plugins(plugin, 'strings'))
      Dir[paths.plugins(plugin, 'strings', '*.yaml')].each do |yaml|
        locale = File.basename(yaml).sub(/.yaml$/, '')
        outfile = paths.build('plugins', plugin, 'strings', "#{locale}.js")
        inline_string_files << outfile if INLINE_LOCALES.include? locale
        file outfile => [dest, yaml] do
          mkdir? paths.build('plugins', plugin, 'strings')
          compile_strings yaml => outfile
        end
        t.enhance [outfile]
      end
    end
    
    # Main script file.
    script_src = paths.plugins(plugin, "#{plugin}.js")
    script_dest = paths.build('plugins', plugin, "#{plugin}.js")
    file script_dest => [dest, script_src] + inline_string_files do
      compile_js script_src => script_dest
      File.open(script_dest, 'a') do |script|
        inline_string_files.each do |isf|
          script.puts File.read(isf).sub(/\/\*.*?\*\//m, '')
        end
      end
    end
    t.enhance [script_dest]
    
    # Miscellaneous directories.
    misc = Dir[paths.plugins(plugin, '*')].find_all do |path|
      File.directory?(path) && File.basename(path) != 'strings'
    end
    misc.each do |path|
      t.enhance wholesale(File.join('plugins', plugin, File.basename(path)))
    end
    
    Rake::Task["^plugins"].enhance ["plugins:#{plugin}"]
  end
end

desc "Build all themes."
task :themes
CLEAN.include paths.build('themes')

namespace :themes do
  Loki.themes.each do |theme|
    task_id = theme.name.to_sym
    desc "Build the '#{theme.name}' theme."
    t = task(task_id)
    
    dest = paths.build('themes', theme.name)
    file dest do
      mkdir? paths.build('themes')
      mkdir? dest
    end
      
    plugins = Loki.plugins.find_all do |plugin|
      File.directory?(paths.plugins(plugin, 'themes', theme.name))
    end
    
    %w(document owner).each do |file|
      glob = "#{file}.{css,sass}"
      sources = Dir[File.join(theme.path, glob)]
      
      plugins.each do |plugin|
        sources |= Dir[paths.plugins(plugin, 'themes', theme.name, glob)]
      end
      
      next if sources.empty?
      
      dest_path = paths.build('themes', theme.name, "#{file}.css")
      file dest_path => ([dest] + sources) do
        compile_css sources => dest_path
      end
      t.enhance [dest_path]
    end
    
    spec_dest = paths.build('themes', theme.name, "#{theme.name}.json")
    spec_src = File.join(theme.path, "#{theme.name}.yaml")
    sources = [paths.plugins]
    sources << spec_src if File.exists?(spec_src)
    file spec_dest => sources do
      spec = if File.exists?(spec_src)
        YAML.load_file(spec_src)
      else
        {}
      end
      
      spec['name'] ||= theme.name.capitalize
      spec['parent'] = nil unless spec.has_key?('parent')
      spec['processed_plugins'] = Loki.plugins
      
      File.open(spec_dest, 'w') do |io|
        io.puts(JSON.pretty_generate(spec))
      end
    end
    t.enhance [spec_dest]
    
    if File.directory?(File.join(theme.path, 'res'))
      res = File.join('themes', theme.name, 'res')
      t.enhance wholesale(res)
    end
    
    Rake::Task["^themes"].enhance ["themes:#{theme.name}"]
  end
end

file paths.build('lib', 'base2.js') => [paths.lib('base2.js')] do |t|
  mkdir? paths.build
  mkdir? paths.build('lib')
  cp t.prerequisites.first, t.name
end
task :base2 => [paths.build('lib', 'base2.js')]
