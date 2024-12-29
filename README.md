# fetch-github-folder

[![Release Workflow](https://github.com/nikelborm/fetch-github-folder/actions/workflows/main.yml/badge.svg)](https://github.com/nikelborm/fetch-github-folder/actions/workflows/main.yml)

## What This Project Does

This project allows you to download any folder inside a repo on github.

## Requirements

You need to have installed latest node, git, npm

## Installation

### From default NPM registry

```bash
npm i fetch-github-folder
```

### From GitHub NPM Registry

1. [Generate `Personal access token (classic)` with `read:packages` scope](https://github.com/settings/tokens/new?description=Install%20packages%20from%20GitHub%20NPM%20registry&scopes=read:packages&default_expires_at=none)
2. Save the token
3. Run `npm login --scope=@nikelborm --auth-type=legacy --registry=https://npm.pkg.github.com` (read more about `--auth-type=legacy` [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token))
4. Enter your username when asked
5. Paste the token as password value
6. Then run `npm i @nikelborm/fetch-github-folder` to install the package

### For local development

```bash
# Clone this repo:
git clone -b main https://github.com/nikelborm/fetch-github-folder.git
# cd to it:
cd fetch-github-folder
# Install dependencies:
npm install
# Create .env file:
cp template.env .env
# Ask for token
read -sp 'Enter github access token: ' gh_token; echo;
# And immediately put it into .env
sed -i "s/\(GITHUB_ACCESS_TOKEN\)='.*'/\1='$gh_token'/" .env
```

## Environment Variables

- `GITHUB_ACCESS_TOKEN`: This is your personal access token from GitHub. It is used to authenticate your requests to the GitHub API. You can generate one [here](https://github.com/settings/tokens/new?description=Read%20repo%20contents%20access%20to%20fetch-github-folder&scopes=public_repo&default_expires_at=none).
- `GITHUB_REPO_OWNER`: This is the username of the owner of the repository you are trying to download from. For example, if the repository's URL is `https://github.com/apache/superset`, the owner is `apache`.
- `GITHUB_REPO_NAME`: This is the name of the repository you are trying to download from. In the example above, the repository name is `superset`.
- `PATH_TO_DIRECTORY_IN_REPO`: This is the path to the directory you want to download. It can be directory that lies inside root of repo like `docker` or it can be some nested directory like `docker/nginx`.
- `COMMIT_SHA_HASH_OR_BRANCH_NAME_OR_TAG_NAME`: This is the commit SHA hash, branch name, or tag name you want to download from. If you don't specify it, the default branch in the repository will be used.
- `LOCAL_DIR_PATH_TO_PUT_INSIDE_REPO_DIR_CONTENTS`: All files and directories from directory of remote repository will be put into a specific local directory and we specify it's path. If it doesn't exist, it will be automatically created.

## How to use

1. Set env variables in `.env` file
2. Run `npm start`

## TODO

1. add posibility for quick request of token through browser (script opens a window and runs the request from as user )
2. make smarter determinator of a main branch ([info](https://chatgpt.com/share/675f3a23-2638-800d-a5ea-3873f01aad0a))
3. support downloading not only folders, but also individual files
4. support creating downloading plans, where user can specify more than one entity (folder/file) to download
5. support git submodules
6. add autodeterminator that this is a public repo and we don't need an API key
7. Maybe find something useful in [download-directory repo](https://github.com/download-directory/download-directory.github.io/)
8. tests
