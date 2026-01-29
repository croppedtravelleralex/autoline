// mesService.ts
// 简单的 fetch 封装，用于前端读取 MES 数据文件

export async function fetchCathodeCart() {
    const resp = await fetch('/mes_data/cathode_cart.json');
    if (!resp.ok) throw new Error('Failed to load cathode cart data');
    return await resp.json();
}

export async function fetchAnodeCart() {
    const resp = await fetch('/mes_data/anode_cart.json');
    if (!resp.ok) throw new Error('Failed to load anode cart data');
    return await resp.json();
}

export async function fetchUtilities() {
    const resp = await fetch('/mes_data/utilities.json');
    if (!resp.ok) throw new Error('Failed to load utilities data');
    return await resp.json();
}

export async function fetchMaterials() {
    const resp = await fetch('/mes_data/materials.json');
    if (!resp.ok) throw new Error('Failed to load materials data');
    return await resp.json();
}

export async function fetchAlarms() {
    const resp = await fetch('/mes_data/alarms.json');
    if (!resp.ok) throw new Error('Failed to load alarms data');
    return await resp.json();
}
