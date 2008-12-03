# This file contains helper code for Loki's rakefile. It is not really useful
# for any other purpose.

LOKI_PATH = File.expand_path('..', File.dirname(__FILE__)) unless defined?(LOKI_PATH)

require 'singleton'

module Loki
  VERSION = File.read(File.join(LOKI_PATH, 'version.txt')).chomp
  
  class Paths
    include Singleton
    
    def initialize
      @build = ENV['BUILD'] || File.join(LOKI_PATH, 'build')
    end
    
    def root(*args)
      File.join(LOKI_PATH, *args)
    end
    
    def build(*args)
      File.join(@build, *args)
    end
    
    def method_missing(name, *args)
      File.join(LOKI_PATH, name.to_s, *args)
    end
  end
  
  def self.plugins
    paths = Dir[Paths.instance.plugins('*')].find_all {|p| File.directory?(p)}
    paths.map {|path| File.basename(path)}
  end
end

def contents(folder)
  entries = Dir[File.join(folder, '*')]
  children = []
  entries.each do |entry|
    children << contents(entry) if File.directory?(entry)
  end
  entries.concat(children).flatten
end

def wholesale(folder)
  src_root = Loki::Paths.instance.root(folder)
  dest_root = Loki::Paths.instance.build(folder)
  CLOBBER.include dest_root
  
  filter = lambda {|e| e[0] != ?.}
  src = Dir.entries(src_root).find_all(&filter)
  dest = File.directory?(dest_root) ? Dir.entries(dest_root).find_all(&filter) : []
  child_dirs = src.find_all {|e| File.directory?(File.join(src_root, e))}
  
  dest.each do |f|
    path = File.join(dest_root, f)
    CLEAN.include path unless File.directory?(path)
  end
  
  child_dirs.each {|d| wholesale File.join(folder, d)}
  
  task folder do |t|
    t.add_description folder
    mkdir Loki::Paths.instance.build unless File.directory?(Loki::Paths.instance.build)
    mkdir dest_root unless File.directory?(dest_root)
    
    # remove files that are in +dest+ but not +src+
    (dest - src).each {|f| rm File.join(dest_root, f)}
    
    src.each do |f|
      path = File.join(src_root, f)
      unless File.directory?(path)
        dest_path = File.join(dest_root, f)
        file(dest_path => [path]) do
          cp path, dest_path
        end.invoke
      else
        Rake::Task[File.join(folder, f)].invoke
      end
    end
  end
end