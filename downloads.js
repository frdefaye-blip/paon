// Publier les fichiers dans les Releases publiques de PAON suffit à les afficher.
const RELEASES_URL = 'https://api.github.com/repos/frdefaye-blip/paon/releases?per_page=100';
const RELEASES_PAGE = 'https://github.com/frdefaye-blip/paon/releases';
const applicationNames = {
    tada: /^tada[-_]/i,
    adapdf: /^adapdf[-_]/i,
    geomada: /^g[eé]omada[-_]/i,
};

function assetDescription(asset) {
    const name = asset.name.toLowerCase();
    let platform = 'Fichier';
    if (name.endsWith('.exe')) {
        platform = name.includes('portable') ? 'Windows · version portable' : 'Windows · installateur';
    } else if (name.endsWith('.deb')) {
        platform = 'Linux · paquet Debian / Ubuntu';
    } else if (name.endsWith('.appimage')) {
        platform = 'Linux · AppImage';
    } else if (name.endsWith('.apk')) {
        platform = 'Android · APK';
    } else if (name.endsWith('.dmg')) {
        platform = 'macOS · image disque';
    } else if (name.endsWith('.zip')) {
        platform = 'Archive ZIP';
    }
    const size = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(asset.size / 1048576);
    return `${platform} · ${size} Mio`;
}

function renderRelease(release, assets) {
    const group = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = release.name || release.tag_name;
    group.append(title);
    const date = document.createElement('p');
    date.className = 'release-date';
    date.textContent = `Publié le ${new Date(release.published_at).toLocaleDateString('fr-FR')}`;
    group.append(date);
    const list = document.createElement('ul');
    list.className = 'versions';
    for (const asset of assets) {
        const row = document.createElement('li');
        row.className = 'version';
        const info = document.createElement('div');
        const name = document.createElement('strong');
        name.className = 'asset-name';
        name.textContent = asset.name;
        const description = document.createElement('small');
        description.textContent = assetDescription(asset);
        info.append(name, description);
        const link = document.createElement('a');
        link.className = 'button';
        link.href = asset.browser_download_url;
        link.textContent = 'Télécharger';
        link.setAttribute('aria-label', `Télécharger ${asset.name}`);
        row.append(info, link);
        list.append(row);
    }
    group.append(list);
    return group;
}

async function loadDownloads(section) {
    const status = section.querySelector('[data-download-status]');
    const current = section.querySelector('[data-current-release]');
    const history = section.querySelector('[data-release-history]');
    const previous = section.querySelector('[data-previous-releases]');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(RELEASES_URL, { signal: controller.signal });
        if (!response.ok) throw new Error('Releases indisponibles');
        const releases = await response.json();
        const matcher = applicationNames[section.dataset.downloadApp];
        const available = releases
            .filter(release => !release.draft && !release.prerelease)
            .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
            .map(release => ({ release, assets: release.assets.filter(asset =>
                matcher.test(asset.name) && /\.(exe|msi|deb|appimage|apk|dmg|zip)$/i.test(asset.name) &&
                asset.browser_download_url.startsWith(`${RELEASES_PAGE}/download/`)
            ) }))
            .filter(item => item.assets.length > 0);
        if (!available.length) {
            status.textContent = 'Les fichiers de ce logiciel seront bientôt disponibles ici.';
            return;
        }
        status.textContent = 'Choisissez le fichier adapté à votre système. La version portable Windows s’utilise sans installation.';
        current.replaceChildren(renderRelease(available[0].release, available[0].assets));
        previous.replaceChildren(...available.slice(1).map(item => renderRelease(item.release, item.assets)));
        history.hidden = available.length < 2;
    } catch {
        status.textContent = 'La liste des téléchargements est momentanément indisponible. Vous pouvez consulter les versions sur GitHub ci-dessous.';
    } finally {
        clearTimeout(timeout);
    }
}

document.querySelectorAll('[data-download-app]').forEach(loadDownloads);
