function groupFoldersByParent(folders) {
  const foldersByParent = new Map();

  for (const folder of folders) {
    const parentId = folder.parentFolder?.toString() || null;

    if (!foldersByParent.has(parentId)) {
      foldersByParent.set(parentId, []);
    }

    foldersByParent.get(parentId).push(folder._id.toString());
  }

  return foldersByParent;
}

function mapFoldersById(folders) {
  const folderMap = new Map();

  for (const folder of folders) {
    folderMap.set(folder._id.toString(), {
      _id: folder._id,
      name: folder.name,
      type: "folder",
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt || null,
      parentFolder: folder.parentFolder?.toString() || null,
      children: [],
    });
  }

  return folderMap;
}

function groupFilesByParent(files) {
  const filesByParent = new Map();

  for (const file of files) {
    const parentId = file.parentFolder?.toString() || null;

    if (!filesByParent.has(parentId)) {
      filesByParent.set(parentId, []);
    }

    filesByParent.get(parentId).push({
      _id: file._id,
      name: file.filename,
      type: "file",
      size: file.size,
      parentFolder: parentId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt || null,
      reminders: file.reminders || [],
    });
  }

  return filesByParent;
}

function findFolderById(tree, targetId) {
  for (const element of tree) {
    if (element.type === "folder") {
      if (element._id.toString() === targetId.toString()) {
        return element;
      }

      const found = findFolderById(element.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function buildTree(folderId, folderMap, foldersByParent, filesByParent) {
  const children = [];

  for (const subfolderId of foldersByParent.get(folderId) || []) {
    const folderElement = folderMap.get(subfolderId);
    folderElement.children = buildTree(
      subfolderId,
      folderMap,
      foldersByParent,
      filesByParent
    );
    children.push(folderElement);
  }

  if (filesByParent.has(folderId)) {
    children.push(...filesByParent.get(folderId));
  }

  return children;
}

export function buildFileTree(folders, files) {
  const folderMap = mapFoldersById(folders);
  const foldersByParent = groupFoldersByParent(folders);
  const filesByParent = groupFilesByParent(files);

  return buildTree(null, folderMap, foldersByParent, filesByParent); // start at root
}

export function addFileToTree(tree, file) {
  const fileParentId = file.parentFolder?.toString() || null;

  if (fileParentId === null) {
    return tree.push({
      _id: file._id,
      name: file.filename,
      type: "file",
      size: file.size,
      parentFolder: null,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt || null,
      reminders: file.reminders || [],
    });
  }

  const parentFolder = findFolderById(tree, fileParentId);

  parentFolder.push({
    _id: file._id,
    name: file.filename,
    type: "file",
    size: file.size,
    parentFolder: fileParentId,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt || null,
    reminders: file.reminders || [],
  });

  return tree;
}

export function removeFileFromTree(tree, file) {
  const fileParent = file.parentFolder?.ToString() || null;

  if (fileParent === null) {
    return tree.filter((item) => item._id.toString() !== file._id.toString());
  }

  const parentFolder = findFolderById(tree, fileParent);

  if (!parentFolder) return tree;

  parentFolder.children = parentFolder.children.filter(
    (item) => item._id.toString() !== file._id.toString()
  );

  return tree;
}

export function addFolderToTree(tree, folder) {
  const folderParentId = folder.parentFolder?.toString() || null;

  if (folderParentId === null) {
    return tree.push({
      _id: folder._id,
      name: folder.name,
      type: "folder",
      parentFolder: null,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt || null,
      children: [],
    });
  }

  const parentFolder = findFolderById(tree, folderParentId);

  if (parentFolder) {
    parentFolder.children.push({
      _id: folder._id,
      name: folder.name,
      type: "folder",
      parentFolder: folderParentId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt || null,
      children: [],
    });
  }

  return tree;
}

export function removeFolderFromTree(tree, folder) {
  const folderId = folder._id.toString();

  if (folder.parentFolder === null) {
    return tree.filter((item) => item._id.toString() !== folderId);
  }

  const parentFolder = findFolderById(tree, folder.parentFolder.toString());
  if (!parentFolder) return tree;

  parentFolder.children = parentFolder.children.filter(
    (item) => item._id.toString() !== folderId
  );

  return tree;
}
