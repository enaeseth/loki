# This file contains helper code for Loki's rakefile. It is not really useful
# for any other purpose.

LOKI_PATH = File.expand_path('..', File.dirname(__FILE__)) unless defined?(LOKI_PATH)

require 'rake'
require 'rake/clean'
require 'singleton'
require 'json'

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
  
  Theme = Struct.new(:name, :path, :settings)
  
  def self.themes
    paths = Dir[Paths.instance.themes('*')].find_all {|p| File.directory?(p)}
    paths.map do |path|
      name = File.basename(path)
      settings = begin
        YAML.load_file(File.join(path, "#{name}.yaml"))
      rescue Errno::ENOENT
        Hash.new
      end
      
      Theme.new(name, path, settings)
    end
  end
end

def mkdir?(path)
  mkdir path unless File.directory?(path)
end

def contents(folder)
  entries = Dir[File.join(folder, '*')]
  children = []
  entries.each do |entry|
    children << contents(entry) if File.directory?(entry)
  end
  entries.concat(children).flatten
end

def compile_js(file, out=nil)
  unless out
    raise ArgumentError unless file.is_a?(Hash)
    file, out = file.to_a[0]
  end
  paths = Loki::Paths.instance
  sh %Q{cpp -undef -P -I#{paths.lib} -DLOKI_VERSION=\\"#{Loki::VERSION}\\" "#{file}" "#{out}"}
end

def compile_strings(file, out=nil)
  unless out
    raise ArgumentError unless file.is_a?(Hash)
    file, out = file.to_a[0]
  end
  flatten = lambda do |hash|
    hash.keys.each do |key|
      next unless hash[key].is_a?(Hash)
      flatten.call(hash.delete(key)).each do |name, value|
        hash["#{key}:#{name}"] = value
      end
    end
    hash
  end
  
  unindent = lambda do |string|
    lines = string.split("\n")
    return unless /^(\s+)/ =~ lines[0]
    white = /^#{$1}/
    lines.map {|l| l.sub(white, '')}.join("\n")
  end
  
  locale = File.basename(file).sub(/#{File.extname(file)}$/, '')
  strings = flatten.call(YAML.load_file(file))
  File.open(out, 'w') do |f|
    header = <<-EOS
    /*
     * This localized strings file was generated automatically by Loki's
     * build system. Do not modify this file directly; instead, edit the YAML
     * source file.
     */
    EOS
    f.puts unindent.call(header)
    f.puts
    
    f.print "Loki.Locale.get(#{locale.inspect}).setStrings("
    f.print JSON.pretty_generate(strings)
    f.puts ");"
  end
end

def compile_css(spec)
  sources, dest = spec.entries[0]
  File.open(dest, 'w') do |out|
    sources.each do |source|
      paths = [File.dirname(source)]
      inc_path = File.join(paths[0], 'inc')
      paths << inc_path if File.directory?(inc_path)
      
      case File.extname(source)
      when '.css'
        out.puts File.read(source)
      when '.sass'
        out.puts Sass::Engine.new(File.read(source), {
          :style => :compact,
          :filename => source,
          :load_paths => paths
        }).render()
      else
        warn "#{source} is neither a CSS nor a Sass file"
      end
    end
  end
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
  
  deps = [dest_root]
  
  file dest_root do |t|
    t.add_description folder
    mkdir? Loki::Paths.instance.build
    mkdir? dest_root
    
    # remove files that are in +dest+ but not +src+
    (dest - src).each {|f| rm File.join(dest_root, f)}
    
    src.each do |f|
      path = File.join(src_root, f)
      dest_path = File.join(dest_root, f)
      unless File.directory?(path)
        file(dest_path => [path]) do
          cp path, dest_path
        end.invoke
      else
        Rake::Task[dest_path].invoke
      end
    end
  end
  
  child_dirs.each do |d|
    child = File.join(folder, d)
    deps += wholesale(child)
    Rake::Task[Loki::Paths.instance.build(child)].enhance [dest_root]
  end
  
  return deps
end
