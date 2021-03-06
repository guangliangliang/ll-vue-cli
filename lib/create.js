const path = require('path')
const fs = require('fs-extra')

const inquirer = require('inquirer')
const Ora = require('ora')
const chalk = require('chalk')
const logSymbols = require('log-symbols')
const validateProjectName = require('validate-npm-package-name')
const TPL_TYPE = require('../lib/util/enum')
const downloadFromRemote = require('../lib/downloadFromRemote')

module.exports = async function create (projectName) {
  const cwd = process.cwd()
  const targetDir = path.resolve(cwd, projectName)
  const name = path.relative(cwd, projectName)

  const result = validateProjectName(name)
  if (!result.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: "${name}"`))
    result.errors && result.errors.forEach(err => {
      console.error(chalk.red.dim('Error: ' + err))
    })
    result.warnings && result.warnings.forEach(warn => {
      console.error(chalk.red.dim('Warning: ' + warn))
    })
    process.exit(1)
  }

  if (fs.existsSync(targetDir)) {
    const { action } = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
        choices: [
          { name: 'Overwrite', value: 'overwrite' },
          { name: 'Cancel', value: false }
        ]
      }
    ])
    if (!action) {
      return
    } else if (action === 'overwrite') {
      console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
      await fs.remove(targetDir)
    }
  }

  const { bolierplateType, author, description, version } = await inquirer.prompt([
    {
      name: 'bolierplateType',
      type: 'list',
      default: 'vue',
      choices: [
        {
          name: 'Vue',
          value: 'vue'
        },
        {
          name: 'Vue_Typescript',
          value: 'vue_typescript_admin'
        },
        {
          name: 'React',
          value: 'react'
        },
        {
          name: 'React_Typescript_Umi',
          value: 'react_umi_admin_typescript'
        },
        {
          name: 'Spring_Boot_Admin',
          value: 'spring_boot_admin'
        },
        {
          name: 'Node_Api',
          value: 'node_api'
        }
      ],
      message: 'Select the boilerplate type.'
    }, {
      type: 'input',
      name: 'description',
      message: 'Please input your project description.',
      default: 'description',
      validate (val) {
        return true
      },
      transformer (val) {
        return val
      }
    }, {
      type: 'input',
      name: 'author',
      message: 'Please input your author name.',
      default: 'author',
      validate (val) {
        return true
      },
      transformer (val) {
        return val
      }
    }, {
      type: 'input',
      name: 'version',
      message: 'Please input your version.',
      default: '0.0.1',
      validate (val) {
        return true
      },
      transformer (val) {
        return val
      }
    }
  ])

  const remoteUrl = TPL_TYPE[bolierplateType]
  console.log(logSymbols.success, `Creating template of project ${bolierplateType} in ${targetDir}`)
  const spinner = new Ora({
    text: `Download template from ${remoteUrl}\n`
  })

  spinner.start()
  downloadFromRemote(remoteUrl, projectName).then(res => {
    fs.readFile(`./${projectName}/package.json`, 'utf8', function (err, data) {
      if (err) {
        spinner.stop()
        console.error(err)
        return
      }
      const packageJson = JSON.parse(data)
      packageJson.name = projectName
      packageJson.description = description
      packageJson.author = author
      packageJson.version = version
      var updatePackageJson = JSON.stringify(packageJson, null, 2)
      fs.writeFile(`./${projectName}/package.json`, updatePackageJson, 'utf8', function (err) {
        spinner.stop()
        if (err) {
          console.error(err)
        } else {
          console.log(logSymbols.success, chalk.green(`Successfully created project template of ${bolierplateType}\n`))
          console.log(`${chalk.grey(`cd ${projectName}`)}\n${chalk.grey('yarn install')}\n${chalk.grey('yarn serve')}\n`)
        }
        process.exit(1)
      })
    })
  }).catch((err) => {
    console.log(logSymbols.error, err)
    spinner.fail(chalk.red('Sorry, it must be something error,please check it out. \n'))
    process.exit(1)
  })
}
