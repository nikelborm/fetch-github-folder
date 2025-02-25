# <img src="https://nikelborm.github.io/fetch-github-folder/logo.png" align="right" width="40px" height="40px"/> fetch-github-folder :lizard:

[![Open in VS Code](https://img.shields.io/static/v1?logo=visualstudiocode&label=&message=Open%20in%20VS%20Code&labelColor=2c2c32&color=007acc&logoColor=007acc)](https://github.dev/nikelborm/fetch-github-folder)
[![NPM package version](https://badge.fury.io/js/fetch-github-folder.svg)](https://www.npmjs.com/package/fetch-github-folder)
[![NPM downloads](https://img.shields.io/npm/dm/fetch-github-folder.svg?style=flat)](https://npmjs.org/package/fetch-github-folder)
[![NPM Last Update](https://img.shields.io/npm/last-update/fetch-github-folder)](https://npmjs.org/package/fetch-github-folder)
[![package.json Dependencies count](https://badgen.net/bundlephobia/dependency-count/fetch-github-folder)](https://www.npmjs.com/package/fetch-github-folder?activeTab=dependencies)
[![package.json Dependents count](https://badgen.net/npm/dependents/fetch-github-folder)](https://www.npmjs.com/package/fetch-github-folder?activeTab=dependents)
[![JSR package version](https://jsr.io/badges/@nikelborm/fetch-github-folder)](https://jsr.io/@nikelborm/fetch-github-folder)
[![JSR package Score](https://jsr.io/badges/@nikelborm/fetch-github-folder/score)](https://jsr.io/@nikelborm/fetch-github-folder)
[![JSR package owner](https://jsr.io/badges/@nikelborm)](https://jsr.io/@nikelborm)
[![GitHub commits per month](https://img.shields.io/github/commit-activity/m/nikelborm/fetch-github-folder)](https://github.com/nikelborm/fetch-github-folder/pulse)
[![GitHub Total commits Count](https://img.shields.io/github/commit-activity/t/nikelborm/fetch-github-folder)](https://github.com/nikelborm/fetch-github-folder/graphs/commit-activity)
[![NPM License](https://img.shields.io/npm/l/fetch-github-folder)](https://github.com/nikelborm/fetch-github-folder?tab=MIT-1-ov-file)
[![Coveralls Coverage Percentage](https://coveralls.io/repos/github/nikelborm/fetch-github-folder/badge.svg?branch=main&rand=9148876)](https://coveralls.io/github/nikelborm/fetch-github-folder?branch=main)
[![CodeFactor Code quality Grade](https://img.shields.io/codefactor/grade/github/nikelborm/fetch-github-folder?label=codefactor)](https://www.codefactor.io/repository/github/nikelborm/fetch-github-folder)
[![Code Climate Technical Debt](https://img.shields.io/codeclimate/tech-debt/nikelborm/fetch-github-folder)](https://codeclimate.com/github/nikelborm/fetch-github-folder/issues)
[![Code Climate Issues](https://img.shields.io/codeclimate/issues/nikelborm/fetch-github-folder)](https://codeclimate.com/github/nikelborm/fetch-github-folder/issues)
[![GitHub Tests Workflow status](https://github.com/nikelborm/fetch-github-folder/actions/workflows/test.yml/badge.svg)](https://github.com/nikelborm/fetch-github-folder/actions/workflows/test.yml)
[![GitHub Release Workflow status](https://github.com/nikelborm/fetch-github-folder/actions/workflows/release.yml/badge.svg)](https://github.com/nikelborm/fetch-github-folder/actions/workflows/release.yml)
[![Sonar Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Bugs Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=bugs)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Code Smells Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Lines of Code Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Reliability Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Security Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Technical Debt Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Maintainability Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Vulnerabilities Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
![OSS Lifecycle status](https://img.shields.io/osslifecycle?file_url=https%3A%2F%2Fgithub.com%2Fnikelborm%2Ffetch-github-folder%2Fblob%2Fmain%2FOSSMETADATA)

<!-- Commented because there's some bug in effect library that prevents proper rendering of this badge -->
<!-- [![npm minzipped bundle size](https://img.shields.io/bundlephobia/minzip/fetch-github-folder)](https://bundlephobia.com/package/fetch-github-folder) -->

<!-- [![npms.io](https://img.shields.io/npms-io/final-score/fetch-github-folder)](update_link_later) -->
<!-- [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) -->

<sup>(Don't judge me for my obsession with badges)</sup>

> [!CAUTION]
>
> This project currently is not stable, but I'm actively working on writing tests and handling edge cases, such as support for Git-LFS and other.
> Check out the `dev` branch to see the latest updates! 😉 (except that I currently don't care and just push to main)

## What This Project Does

This project allows you to download any folder inside a repo on github.

## Requirements

You need to have installed latest node, git, npm

## Installation

### From [default NPM registry](https://www.npmjs.com/package/fetch-github-folder)

```bash
npm i fetch-github-folder
```

### From [JSR](https://jsr.io/@nikelborm/fetch-github-folder)

Unfortunately JSR doesn't support publishing executables yet, so you can install only script library with functions that will allow you to fetch github folder from other scripts.

```bash
npx jsr add @nikelborm/fetch-github-folder
```

### From [GitHub's NPM registry](https://github.com/nikelborm/fetch-github-folder/pkgs/npm/fetch-github-folder)

1. [Generate `Personal access token (classic)` with `read:packages` scope](https://github.com/settings/tokens/new?description=Install%20packages%20from%20GitHub%20NPM%20registry&scopes=read:packages&default_expires_at=none)
2. Save the token
3. Login to Github's NPM registry (yes you need to do it, even if the package is public):

   ```bash
   npm login --scope=@nikelborm --auth-type=legacy --registry=https://npm.pkg.github.com
   ```

   You can also read more about `--auth-type=legacy` [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token)

4. Enter your username when asked
5. Paste the token as password value
6. Then install the package by executing:

   ```bash
   npm i @nikelborm/fetch-github-folder
   ```

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
- `REPO_OWNER`: This is the username of the owner of the repository you are trying to download from. For example, if the repository's URL is `https://github.com/apache/superset`, the owner is `apache`.
- `REPO_NAME`: This is the name of the repository you are trying to download from. In the example above, the repository name is `superset`.
- `PATH_TO_ENTITY_IN_REPO`: This is the path to the directory you want to download. It can be directory that lies inside root of repo like `docker` or it can be some nested directory like `docker/nginx`.
- `GIT_REF`: This is the commit SHA hash, branch name, or tag name you want to download from. If you don't specify it, the default branch in the repository will be used.
- `DESTINATION_PATH`: If entity at `PATH_TO_ENTITY_IN_REPO` is a file, then destination path is a path to downloaded file. If it's a directory, then all files and directories from target directory of remote repository at `PATH_TO_ENTITY_IN_REPO` will be put into a directory with path from `DESTINATION_PATH`. If the directory doesn't exist, it will be automatically created.

## How to use

1. Set env variables in `.env` file
2. Run `npm start`
