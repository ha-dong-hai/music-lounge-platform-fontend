import assert from 'node:assert/strict'
import { mucTheoVai, tabHopLe } from './mucTaiKhoan.js'

const keys = (vai) => mucTheoVai(vai).map((m) => m.key).join(',')
let dat = 0
const ca = (ten, fn) => { fn(); dat++; void ten }

ca('chu thay du 5 muc', () => assert.equal(keys('Owner'), 'profile,followed,identity,preferences,privacy'))
ca('khan gia khong co dinh danh', () => assert.equal(keys('Audience'), 'profile,followed,preferences,privacy'))
ca('nhan vien khong co dinh danh', () => assert.equal(keys('Staff'), 'profile,followed,preferences,privacy'))
ca('admin chi con 2 muc', () => assert.equal(keys('Admin'), 'profile,privacy'))
ca('vai la: nhu khan gia (khong dinh danh)', () => assert.equal(keys(undefined), 'profile,followed,preferences,privacy'))
ca('chu mo ?tab=identity giu nguyen', () => assert.equal(tabHopLe('Owner', 'identity'), 'identity'))
ca('nhan vien mo ?tab=identity ve profile', () => assert.equal(tabHopLe('Staff', 'identity'), 'profile'))
ca('admin mo ?tab=preferences ve profile', () => assert.equal(tabHopLe('Admin', 'preferences'), 'profile'))
ca('tab la ve profile', () => assert.equal(tabHopLe('Owner', 'xyz'), 'profile'))
ca('khong co tab ve profile', () => assert.equal(tabHopLe('Audience', null), 'profile'))
console.log(`mucTaiKhoan: ${dat}/10 đạt`)
