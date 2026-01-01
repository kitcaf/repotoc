/**
 * 路径还原算法
 * 根据拿到的md文件路径列表转换为文件树结构
 * 本质上是构建Trie树，只不过这里节点：按照路径片段切分的文件名
*/

import { DocNode } from "./type/docNode.js";

/**
 * 将扁平路径列表转换为Tire树形结构 本质就是tire算法
 * @param paths 
 * @param linkPrefix 
 * @returns 
 */
export function buildTreeFromPaths(paths: string[], linkPrefix: string): DocNode[] {

    //root指针：指向处于最上层的DocNode节点
    const root: DocNode[] = []
    for (const filePath of paths) {
        const parts = filePath.split("/")
        //从root开始查找
        let currentLevel = root;

        for (let i = 0; i < parts.length; i++) {
            const pathName = parts[i]
            const isFile = i === parts.length - 1 //路径的最后一个是md文件
            //查找当前层级是否存在这个pathName
            const existingNode: DocNode | undefined = currentLevel.find(node => node.name === pathName)
            const normalizedPath = parts.slice(0, i + 1).join('/')

            if (existingNode) {
                if (isFile) console.warn(`Duplicate file found: ${filePath}`);
                currentLevel = existingNode.children!
            }
            else { //如果不存在 -> 当前层级新建node
                const docNode: DocNode = {
                    name: pathName, //非file文件目前还是有后缀的
                    path: normalizedPath, //重组路径,
                    type: isFile ? 'file' : 'dir',
                    linkPath: linkPrefix === '.' || !linkPrefix
                        ? normalizedPath
                        : `${linkPrefix}/${normalizedPath}`,
                    children: isFile ? undefined : []
                }

                currentLevel.push(docNode)

                if (!isFile) {
                    currentLevel = docNode.children!
                }
            }
        }
    }
    return root //返回树的根节点
}