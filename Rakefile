require 'rake'
require 'rake/packagetask'
require 'rake/clean'

# Bootstrap.
LOKI_PATH = File.expand_path(File.dirname(__FILE__))
require File.join(LOKI_PATH, 'lib', 'build')

paths = Loki::Paths.instance # shorthand

wholesale 'themes'
CLOBBER.include ['build', 'pkg']

task :default => [:build]
desc "Build the Loki environment."
task :build => [:core, :plugins, :base2, 'themes']

desc "Build all Loki plugins."
task :plugins

def expand(strings)
  hashes = []
  strings.keys.each do |key|
    next unless /^(\w+):(.+)$/ =~ key
    group, rest = $1, $2
    hashes.push(strings[group] = {}) unless strings[group]
    strings[group][rest] = strings.delete(key)
  end
  
  hashes.each {|h| expand(h)}
  strings
end

namespace :plugins do
  Loki.plugins.each do |plugin|
    plugin = plugin.to_sym
    desc "Build the '#{plugin}' plugin."
    task plugin do
      mkdir paths.build('plugins') rescue nil
      dest = paths.build('plugins', plugin)
      mkdir dest unless File.directory?(dest)
      
      
    end
    
    task "^plugins" => [plugin]
  end
end
