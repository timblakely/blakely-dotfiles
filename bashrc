# ~/.bashrc: executed by bash(1) for non-login shells.

# If not running interactively, don't do anything
[ -z "$PS1" ] && return

####################################################
# Helper functions
####################################################

maybesrc () {
  if [ -e $1 ]; then
    if [ ! -z "$CC_BASHRC_LOGGING" ]; then
      echo "Sourcing $1"
    fi
    source $1;
  fi
}
export -f maybesrc

####################################################
# General configuration
####################################################

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "$debian_chroot" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

export GIT_EDITOR="/usr/bin/code -w"
export EDITOR="/usr/bin/code -w"
export VISUAL="/usr/bin/code -w"

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# make less more friendly for non-text input files, see lesspipe(1)
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# Allow tab-complete for symlinks
bind 'set mark-symlinked-directories on'

####################################################
# Terminal and prompt configuration
####################################################

PS1="[\[\033[0;31m\]\h\[\033[0m\]>\[\033[1;36m\]\W\[\033[0m\]]> "
alias tt1="PS1=\"[\\[\\033[0;31m\\]\\h\\[\\033[0m\\]>\\[\\033[1;36m\\]\\W\\[\\033[0m\\]]> \""
alias tt2="PS1=\"[\\[\\033[0;31m\\]\\h\\[\\033[0m\\]>\\[\\033[1;36m\\]\\w\\[\\033[0m\\]]> \""

# set a fancy prompt (non-color, unless we know we "want" color)
#case "$TERM" in
#    xterm-color) color_prompt=yes;;
#esac

#if [ "$TERM" = "xterm" ]; then
#   export TERM=vt100
#fi

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if [ -f /etc/bash_completion ] && ! shopt -oq posix; then
    . /etc/bash_completion
fi

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    #alias dir='dir --color=auto'
    #alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

####################################################
# Path manipulation
####################################################

# Disabled for now
# export PATH=${PATH}:$HOME/gcutil-1.9.1

PYTHONSTARTUP=$HOME'/.pythonrc'
export PYTHONSTARTUP

PATH="$HOME/bin:$HOME/local/bin:$HOME/.npm-global/bin:$PATH"

####################################################
# ESP32 path and environment variables
####################################################

PATH="${PATH}:$HOME/esp/xtensa-esp32-elf/bin"
export IDF_PATH=$HOME/esp/esp-idf

alias mo0='python -m serial.tools.miniterm --rts 0 --dtr 0 --raw /dev/ttyUSB0 115200'
alias mo1='python -m serial.tools.miniterm --rts 0 --dtr 0 --raw /dev/ttyUSB1 115200'

####################################################
# arm toolchain path and environment variables
####################################################

export PATH="${PATH}":/home/tim/gcc-arm-none-eabi-6_2-2016q4/bin

####################################################
# Aliases
####################################################
alias alert='notify-send --urgency=low -i "$([ $? = 0 ] && echo terminal || echo error)" "$(history|tail -n1|sed -e '\''s/^\s*[0-9]\+\s*//;s/[;&|]\s*alert$//'\'')"'
alias e='emacs'
alias l='ls -CF'
alias la='ls -A'
alias ll='ls -alF'
alias py='/usr/bin/python2.7'
alias u='cd ../'
alias uu='cd ../../'
alias uuu='cd ../../../'
alias uuuu='cd ../../../../'
alias uuuuu='cd ../../../../../'
alias uuuuuu='cd ../../../../../../'
alias uuuuuuu='cd ../../../../../../../'
alias uuuuuuuu='cd ../../../../../../../../'
alias uuuuuuuuu='cd ../../../../../../../../../'
alias uuuuuuuuuu='cd ../../../../../../../../../../'
alias venv='source ~/venv/bin/activate'
alias venv3='source ~/venv3/bin/activate'

# Allows sudo aliases
alias sudo='sudo '

# Overwrite aliases if we need to
if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

####################################################
# Saving bash history
####################################################

# Avoid duplicates
export HISTCONTROL=ignoredups:erasedups:ignorespace
export HISTSIZE=""
# When the shell exits, append to the history file instead of overwriting it
shopt -s histappend

# After each command, append to the history file and reread it
# export PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND$'\n'}history -a; history -c; history -r"

# Save each command to the history, but don't reread it
export PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND$'\n'}history -a"

####################################################
# cd -> pushd
####################################################
function cd ()
{
  if [ "$1" == "" ]; then
    builtin cd
  else
    if [[ ! (( -d "$1" || -L "$1" )) ]]; then
      builtin cd $1
    elif [ -e $1 ]; then
      pushd $1 &> /dev/null   #dont display current stack
    fi
  fi
}
alias b='popd > /dev/null'

####################################################
# K8s
####################################################

alias k="kubectl"

####################################################
# Libvirt
####################################################

export LIBVIRT_DEFAULT_URI=qemu:///system

####################################################
# Google config
####################################################

maybesrc $HOME"/.bashrc.google"
maybesrc $HOME"/.bashrc.extra"

####################################################
# Likely Garbage
####################################################

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

REGISTRY_STORAGE_FILESYSTEM_ROOTDIRECTORY=/data/docker_registry

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
