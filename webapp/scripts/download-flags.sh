#!/usr/bin/env bash
output_dir=./build/static/img/
url=https://github.com/oxguy3/flags/archive/gh-pages.zip
tmpdir=$(mktemp -d)

# Create 'img' subdirectory in the static section of the site
cd $(dirname "${0}")/..
mkdir -p "${output_dir}" 2>/dev/null
cd "${output_dir}"
output_dir=${PWD}
echo "Output directory ${output_dir}"
echo "Temp directory ${tmpdir}"

# Dowbload repository with flags and extract us flags only
echo "Download flags repository: ${url}"
wget -q -O "${tmpdir}/flags.zip" "${url}" \
&& cd "${tmpdir}" \
&& echo "Extract US flags into ${PWD}" \
&& unzip flags.zip 'flags-gh-pages/svg/us*' \
&& cp -vfaT ./flags-gh-pages/svg "${output_dir}" \
&& echo "Now all flags are stored in ${output_dir} directory"
cd "${output_dir}"

# Cleanup
rm -rf "${tmpdir}"

