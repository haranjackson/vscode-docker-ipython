## Description

Say you have a Dockerfile in your current directory, specifying an environment under which you want Python to run.
This extension allows you to develop and run code interactively under this environment.

It is built upon the work of pancho111203: github.com/pancho111203/vscode-ipython

Note that `~/.aws` is mapped to `/root/.aws` in the Docker container (so that you can access your AWS credentials, if you would like to).

## Usage

There are two commands:

- `docker-ipython.sendFileContentsToIPython`:
  sends the complete file contents into the open Python instance (or a new one if none is open)

- `docker-ipython.sendSelectedToIPython`:
  sends the selected lines, or the one where the cursor is, to the open Python instance (or a new one if none is open)


## Limitations

- You cannot run multiple instances simultaneously.
