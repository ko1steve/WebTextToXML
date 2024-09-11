import localforage from 'localforage'
import React, { useEffect, useState } from 'react'
import { CommandData, IGroupCommandDetail, StringBuilder } from 'src/config/commandData'
import { CommandType, GroupType } from 'src/mainConfig'
import { DataModel } from 'src/model/dataModel'
import { Container } from 'typescript-ioc'

enum ButtonState {
  Active = 'active',
  Inactive = 'inactive'
}

interface IExportXmlButtonProps {
  className: string
  id: string
}

const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

const nextGroupCommandPromise = (xmlContentSB: StringBuilder, groupList: string[]) => {
  return new Promise<void>(resolve => {
    localforage.getItem(groupList[0] + '-command').then((commandData) => {
      localforage.getItem(groupList[0] + '-detail').then((groupData) => {
        let groupTagStr: string = ''
        const groupStartIndex: number = (groupData as IGroupCommandDetail)?.startIndex
        if (groupStartIndex != null) {
          groupTagStr = ` markLine="${groupStartIndex + 1}"`
        }
        xmlContentSB.append(`  < ${groupList[0]}${groupTagStr}>`)
        if (!commandData) {
          xmlContentSB.append('  </' + groupList[0] + '>')
          return resolve()
        }
        const commands = commandData as CommandData[]
        commands.forEach((command, index) => {
          const sqlTagStr: string = `startLine="${command.startIndex + 1}" endLine="${command.endIndex + 1}"`
          let sqlCommandStr = `    <SQL sql_idx="${index + 1}" ${sqlTagStr}>`
          //* 處理 XML 跳脫字元
          sqlCommandStr += escapeXml((command.content as any)._strings.join('\r\n')) + '</SQL>'
          xmlContentSB.append(sqlCommandStr)
        })
        xmlContentSB.append('  </' + groupList[0] + '>')
        groupList.splice(0, 1)
        if (groupList.length > 0) {
          nextGroupCommandPromise(xmlContentSB, groupList).then(() => resolve())
        } else {
          resolve()
        }
      })
    })
  })
}

export const ExportXmlButton: React.FC<IExportXmlButtonProps> = ({ className, id }) => {
  const dataModel = Container.get(DataModel)
  const [isCommandValid, setCommandValid] = useState<boolean>(dataModel.getCommandValid(dataModel.currentTab))

  const handleOnClick = () => {
    if (!dataModel.getCommandValid(dataModel.currentTab)) {
      return
    }
    const overlay = document.getElementById('overlay') as HTMLDivElement
    overlay.style.display = 'flex'

    const xmlContentSB = new StringBuilder()
    xmlContentSB.append('<?xml version="1.0" encoding="UTF-8"?>')
    xmlContentSB.append('<SQLBodys>')

    const groupList: GroupType[] = Object.values(GroupType)

    nextGroupCommandPromise(xmlContentSB, groupList).then(() => {
      xmlContentSB.append('</SQLBodys>')
      const blob = new Blob([xmlContentSB.toString('\r\n')], { type: 'text/xml' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = dataModel.fileName.replace(/.sql$/, '.xml')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      overlay.style.display = 'none'
    })
  }

  useEffect(() => {
    const onCommandValidChange = (data: { commandType: CommandType, isValid: boolean }) => {
      setCommandValid(data.isValid)
    }
    const onTabChange = (commandType: CommandType) => {
      setCommandValid(dataModel.getCommandValid(commandType))
    }
    const onCommandValidChangeBinding = dataModel.onCommandValidChangeSignal.add(onCommandValidChange)
    const onTabChangeBinding = dataModel.onTabChangeSignal.add(onTabChange)
    return () => {
      dataModel.onCommandValidChangeSignal.detach(onCommandValidChangeBinding)
      dataModel.onTabChangeSignal.detach(onTabChangeBinding)
    }
  }, [])

  return (
    <button className={className + ' ' + (isCommandValid ? ButtonState.Active : ButtonState.Inactive)} id={id} onClick={handleOnClick}>Export as XML</button>
  )
}
