CREATE DATABASE [Resto]
GO
USE [Resto]
GO
/****** Object:  Table [dbo].[AbstractDeliveryOrder]    Script Date: 04.08.2026 2:25:32 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AbstractDeliveryOrder](
	[dtype] [nvarchar](5) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[actualTime] [datetime] NULL,
	[address_additionalInfo] [nvarchar](500) NULL,
	[address_building] [nvarchar](255) NULL,
	[address_doorphone] [nvarchar](255) NULL,
	[address_entrance] [nvarchar](255) NULL,
	[address_externalCartographyId] [nvarchar](255) NULL,
	[address_flat] [nvarchar](255) NULL,
	[address_floor] [nvarchar](255) NULL,
	[address_house] [nvarchar](500) NULL,
	[address_index] [nvarchar](255) NULL,
	[address_region] [uniqueidentifier] NULL,
	[avgCourierMark] [float] NULL,
	[avgFoodMark] [float] NULL,
	[avgMark] [float] NULL,
	[avgOperatorMark] [float] NULL,
	[billTime] [datetime] NULL,
	[cancelTime] [datetime] NULL,
	[closeTime] [datetime] NULL,
	[comment] [nvarchar](500) NULL,
	[conception] [uniqueidentifier] NULL,
	[confirmTime] [datetime] NULL,
	[cookingFinishTime] [datetime] NULL,
	[courier] [uniqueidentifier] NULL,
	[createdTime] [datetime] NOT NULL,
	[customApiData] [nvarchar](255) NULL,
	[customerName] [nvarchar](255) NULL,
	[deliveryCancelCause] [uniqueidentifier] NULL,
	[deliveryCancelComment] [nvarchar](255) NULL,
	[deliveryDate] [datetime] NOT NULL,
	[deliveryDurationInMinutes] [numeric](19, 0) NULL,
	[deliveryNumber] [nvarchar](255) NULL,
	[deliveryOperator] [uniqueidentifier] NULL,
	[deliveryStatus] [int] NOT NULL,
	[ecsData_courierComment] [nvarchar](500) NULL,
	[ecsData_courierName] [nvarchar](255) NULL,
	[ecsData_courierPhone] [nvarchar](50) NULL,
	[ecsData_serviceId] [uniqueidentifier] NULL,
	[ecsData_serviceName] [nvarchar](255) NULL,
	[emailAddress] [nvarchar](255) NULL,
	[forceCloseTime] [datetime] NULL,
	[forceClosed] [tinyint] NOT NULL,
	[iikoCard5Coupon] [nvarchar](255) NULL,
	[indexInCourierRoute] [int] NULL,
	[isCourierSelectedManually] [tinyint] NOT NULL,
	[isCustomerAuthorizedInIikoBiz] [tinyint] NOT NULL,
	[isDeliveryDateSelectedManuallyForExternalOrder] [tinyint] NULL,
	[isSelfService] [tinyint] NOT NULL,
	[lastDefaultTerminalDeliveryDurationInMinutes] [numeric](19, 0) NULL,
	[lastModifyDate] [datetime] NULL,
	[lastModifyDeliveryNode] [uniqueidentifier] NULL,
	[lastVerifiedDeliveryRestrictionsHash] [nvarchar](255) NULL,
	[latitude] [float] NULL,
	[longitude] [float] NULL,
	[marketingSource] [uniqueidentifier] NULL,
	[movedToDeliveryId] [uniqueidentifier] NULL,
	[opinionComment] [nvarchar](1000) NULL,
	[orderId] [uniqueidentifier] NULL,
	[orderSum] [numeric](19, 9) NOT NULL,
	[orderType] [uniqueidentifier] NOT NULL,
	[personsCount] [int] NOT NULL,
	[phoneNumber] [nvarchar](255) NOT NULL,
	[predictedCookingCompleteTime] [datetime] NULL,
	[predictedDeliveryTime] [datetime] NULL,
	[printTime] [datetime] NULL,
	[problem_hasProblem] [tinyint] NOT NULL,
	[problem_problem] [nvarchar](1000) NULL,
	[referrerId] [uniqueidentifier] NULL,
	[sendTime] [datetime] NULL,
	[sourceId] [uniqueidentifier] NULL,
	[sourceKey] [nvarchar](255) NULL,
	[splitBetweenPersons] [tinyint] NOT NULL,
	[terminalId] [uniqueidentifier] NULL,
	[zone] [nvarchar](255) NULL,
	[address_street_id] [uniqueidentifier] NULL,
	[customerId] [uniqueidentifier] NULL,
	[deliveryOrderId] [uniqueidentifier] NULL,
	[address_line1] [nvarchar](500) NULL,
	[address_line2] [nvarchar](500) NULL,
	[movedFromDeliveryId] [uniqueidentifier] NULL,
	[movedFromTerminalGroupId] [uniqueidentifier] NULL,
	[movedToTerminalGroupId] [uniqueidentifier] NULL,
	[isAsap] [tinyint] NULL,
	[packedTime] [datetime] NULL,
	[phoneExtension] [nvarchar](255) NULL,
 CONSTRAINT [PK_AbstractDeliveryOrder_ba30c0c4] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [AbstractDeliveryOrder_deliveryDate]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [AbstractDeliveryOrder_deliveryDate] ON [dbo].[AbstractDeliveryOrder]
(
	[deliveryDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AccountingTransaction]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AccountingTransaction](
	[dtype] [nvarchar](8) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[cashFlowCategory] [uniqueidentifier] SPARSE  NULL,
	[cashOrderNumber] [nvarchar](255) SPARSE  NULL,
	[comment] [nvarchar](2000) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[created] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateSecondary] [datetime] SPARSE  NULL,
	[documentId] [uniqueidentifier] SPARSE  NULL,
	[documentItemId] [uniqueidentifier] SPARSE  NULL,
	[from_amount] [numeric](19, 9) NULL,
	[from_account] [uniqueidentifier] NULL,
	[from_counteragent] [uniqueidentifier] SPARSE  NULL,
	[from_product] [uniqueidentifier] SPARSE  NULL,
	[modified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[num] [nvarchar](255) SPARSE  NULL,
	[originDepartment] [uniqueidentifier] SPARSE  NULL,
	[session_id] [uniqueidentifier] SPARSE  NULL,
	[sum] [numeric](19, 9) NULL,
	[sumNds] [numeric](19, 9) NULL,
	[to_amount] [numeric](19, 9) NULL,
	[to_account] [uniqueidentifier] NULL,
	[to_counteragent] [uniqueidentifier] SPARSE  NULL,
	[to_product] [uniqueidentifier] SPARSE  NULL,
	[type] [char](20) NOT NULL,
	[ndsPercent] [numeric](19, 9) NULL,
	[to_productSize] [uniqueidentifier] SPARSE  NULL,
	[auth_card_slip] [nvarchar](64) SPARSE  NULL,
	[auth_user] [uniqueidentifier] SPARSE  NULL,
	[cashier] [uniqueidentifier] SPARSE  NULL,
	[causeEvent_id] [uniqueidentifier] SPARSE  NULL,
	[chequeNumber] [int] SPARSE  NULL,
	[currency] [uniqueidentifier] SPARSE  NULL,
	[currencyRate] [numeric](19, 9) NULL,
	[isFiscal] [tinyint] SPARSE  NULL,
	[orderId] [uniqueidentifier] SPARSE  NULL,
	[paymentType] [uniqueidentifier] SPARSE  NULL,
	[sumInCurrency] [numeric](19, 9) NULL,
	[approvalCode] [nvarchar](255) SPARSE  NULL,
	[cardNumber] [nvarchar](255) SPARSE  NULL,
	[cardOwnerCompany] [nvarchar](255) SPARSE  NULL,
	[cardTypeName] [nvarchar](255) SPARSE  NULL,
	[nominal] [numeric](19, 9) NULL,
	[vouchersNum] [int] SPARSE  NULL,
	[salesSum] [numeric](19, 9) NULL,
	[program] [uniqueidentifier] SPARSE  NULL,
	[revenueLevel] [numeric](19, 9) NULL,
	[penaltyOrBonusType] [uniqueidentifier] SPARSE  NULL,
	[writeoff_id] [uniqueidentifier] SPARSE  NULL,
	[attendanceEntry_id] [uniqueidentifier] SPARSE  NULL,
	[scheduleItem_id] [uniqueidentifier] SPARSE  NULL,
	[inventoryEvent_id] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_AccountingTransaction_433baff9] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [AccountingTransaction_date]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [AccountingTransaction_date] ON [dbo].[AccountingTransaction]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Announcement]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Announcement](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[createdInfo_date] [datetime] NULL,
	[createdInfo_user] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[modifiedInfo_date] [datetime] NULL,
	[modifiedInfo_user] [uniqueidentifier] NULL,
	[properties] [ntext] NULL,
	[textFormatted] [ntext] NULL,
	[textPlain] [ntext] NULL,
 CONSTRAINT [PK_Announcement_9d1ff8cb] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [Announcement_dateTo_dateFrom]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [Announcement_dateTo_dateFrom] ON [dbo].[Announcement]
(
	[dateTo] ASC,
	[dateFrom] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AssemblyChart]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AssemblyChart](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[product] [uniqueidentifier] NOT NULL,
	[appearance] [nvarchar](2000) NULL,
	[assembledAmount] [numeric](19, 9) NOT NULL,
	[description] [nvarchar](2000) NULL,
	[directWriteoffStoreSpecification] [ntext] NULL,
	[franchiseMasterId] [uniqueidentifier] NULL,
	[franchiseOriginalId] [uniqueidentifier] NULL,
	[franchiseUniqueId] [uniqueidentifier] NULL,
	[organoleptic] [nvarchar](2000) NULL,
	[outputComment] [nvarchar](2000) NULL,
	[picture] [uniqueidentifier] NULL,
	[productSizeAssemblyStrategy] [int] NOT NULL,
	[technologyDescription] [ntext] NULL,
	[versionCompatibility] [nvarchar](10) NOT NULL,
	[writeoffStrategy] [int] NULL,
 CONSTRAINT [PK_AssemblyChart_d0e5ef1e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [AssemblyChart_product_dateFrom]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [AssemblyChart_product_dateFrom] ON [dbo].[AssemblyChart]
(
	[product] ASC,
	[dateFrom] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AssemblyChartItem]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AssemblyChartItem](
	[id] [uniqueidentifier] NOT NULL,
	[sortWeight] [float] NOT NULL,
	[amountIn] [numeric](19, 9) NOT NULL,
	[amountMiddle] [numeric](19, 9) NOT NULL,
	[amountOut] [numeric](19, 9) NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountIn1] [numeric](19, 9) NULL,
	[amountIn2] [numeric](19, 9) NULL,
	[amountIn3] [numeric](19, 9) NULL,
	[amountOut1] [numeric](19, 9) NULL,
	[amountOut2] [numeric](19, 9) NULL,
	[amountOut3] [numeric](19, 9) NULL,
	[packageCount] [numeric](19, 9) NULL,
	[packageTypeId] [uniqueidentifier] NULL,
	[productSizeSpecification] [uniqueidentifier] NULL,
	[storeSpecification] [ntext] NULL,
	[assemblyChart_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_AssemblyChartItem_c89ef45f] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [AssemblyChartItem_assemblyChart]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [AssemblyChartItem_assemblyChart] ON [dbo].[AssemblyChartItem]
(
	[assemblyChart_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ATransactionBalance]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ATransactionBalance](
	[id] [uniqueidentifier] NOT NULL,
	[account] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[cashFlowCategory] [uniqueidentifier] NULL,
	[conception] [uniqueidentifier] NULL,
	[counteragent] [uniqueidentifier] NULL,
	[counteragentAlternative] [uniqueidentifier] NULL,
	[department] [uniqueidentifier] NULL,
	[product] [uniqueidentifier] NULL,
	[productAlternative] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[sumNds] [numeric](19, 9) NOT NULL,
	[dateTo] [date] NOT NULL,
 CONSTRAINT [PK_ATransactionBalance_9888fc40] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [ATransactionBalance_dateTo_department]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [ATransactionBalance_dateTo_department] ON [dbo].[ATransactionBalance]
(
	[dateTo] ASC,
	[department] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ATransactionSum]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ATransactionSum](
	[id] [uniqueidentifier] NOT NULL,
	[account] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[cashFlowCategory] [uniqueidentifier] NULL,
	[conception] [uniqueidentifier] NULL,
	[counteragent] [uniqueidentifier] NULL,
	[counteragentAlternative] [uniqueidentifier] NULL,
	[department] [uniqueidentifier] NULL,
	[product] [uniqueidentifier] NULL,
	[productAlternative] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[sumNds] [numeric](19, 9) NOT NULL,
	[dateFrom] [date] NOT NULL,
 CONSTRAINT [PK_ATransactionSum_59d7ed47] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [ATransactionSum_dateFrom_department]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [ATransactionSum_dateFrom_department] ON [dbo].[ATransactionSum]
(
	[dateFrom] ASC,
	[department] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ATransactionSumSession]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ATransactionSumSession](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[to_amount] [numeric](19, 9) NOT NULL,
	[to_productSize] [uniqueidentifier] NULL,
	[to_product] [uniqueidentifier] NOT NULL,
	[session_id] [uniqueidentifier] NULL,
	[from_account] [uniqueidentifier] NOT NULL,
	[sum] [numeric](19, 9) NOT NULL,
 CONSTRAINT [PK_ATransactionSumSession_1134c2e2] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [ATransactionSumSession_date]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [ATransactionSumSession_date] ON [dbo].[ATransactionSumSession]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BudgetPlan]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BudgetPlan](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[budgetType] [int] NOT NULL,
	[comment] [nvarchar](255) NULL,
	[dateCreated] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[startDate] [datetime] NOT NULL,
	[status] [int] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[userModified] [uniqueidentifier] NULL,
 CONSTRAINT [PK_BudgetPlan_316c94e1] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BudgetPlanItem]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BudgetPlanItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[budgetPlanId] [uniqueidentifier] NULL,
	[conception] [uniqueidentifier] NULL,
	[counterAccount] [uniqueidentifier] NULL,
	[department] [uniqueidentifier] NULL,
	[factValue] [numeric](19, 9) NULL,
	[factValueLastYear] [numeric](19, 9) NULL,
	[periodInBudget] [int] NOT NULL,
	[planValue] [numeric](19, 9) NULL,
	[valueType] [int] NULL,
 CONSTRAINT [PK_BudgetPlanItem_fef460a] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CardTransaction]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CardTransaction](
	[dtype] [nvarchar](8) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[accepted] [tinyint] NULL,
	[anonymized] [tinyint] NOT NULL,
	[executed] [tinyint] NULL,
	[externalId] [nvarchar](255) NULL,
	[orderId] [uniqueidentifier] NULL,
	[originalTransactionId] [uniqueidentifier] NULL,
	[paymentSystem] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NULL,
	[type] [int] NULL,
	[verified] [tinyint] NULL,
	[operationData_authorizationCode] [nvarchar](255) NULL,
	[operationData_cardExpiryDate] [nvarchar](255) NULL,
	[operationData_cardNumber] [nvarchar](255) NULL,
	[operationData_currencyCode] [nvarchar](255) NULL,
	[operationData_hostDateTime] [nvarchar](255) NULL,
	[operationData_hostResponseCode] [nvarchar](255) NULL,
	[operationData_hostTransactionId] [int] NULL,
	[operationData_operationCode] [int] NULL,
	[operationData_originalOperationCode] [int] NULL,
	[operationData_pinCodingMode] [int] NULL,
	[operationData_receiptData] [nvarchar](255) NULL,
	[operationData_referenceNumber] [nvarchar](255) NULL,
	[operationData_status] [int] NULL,
	[operationData_sum] [nvarchar](255) NULL,
	[operationData_terminalDateTime] [nvarchar](255) NULL,
	[operationData_terminalId] [nvarchar](255) NULL,
	[operationData_terminalTransactionId] [int] NULL,
	[operationData_textResponse] [nvarchar](255) NULL,
	[operationData_transactionId] [int] NULL,
	[ecrNumber] [int] NULL,
	[ecrReceiptNumber] [int] NULL,
	[invoiceNumber] [int] NULL,
	[issuerName] [nvarchar](255) NULL,
	[rrn] [nvarchar](255) NULL,
	[edelweissCard_roomNumber] [nvarchar](255) NULL,
	[edelweissOperationTime] [datetime] NULL,
	[jettonCard_externalId] [nvarchar](255) NULL,
	[jettonOperationTime] [datetime] NULL,
	[jettonTransactionId] [uniqueidentifier] NULL,
	[credential] [nvarchar](255) NULL,
	[cardSecret] [nvarchar](255) NULL,
	[deviceId] [uniqueidentifier] NULL,
	[luckyTicketOperationTime] [datetime] NULL,
	[luckyTicketTransactionId] [int] NULL,
	[method] [int] NULL,
	[plastekCard_number] [nvarchar](255) NULL,
	[plastekCard_pin] [nvarchar](255) NULL,
	[plastekCard_type] [int] NULL,
	[plastekOperationTime] [nvarchar](255) NULL,
	[plastekTransactionId] [int] NULL,
	[terminalId] [nvarchar](255) NULL,
	[hoistCard_roomNumber] [nvarchar](255) NULL,
	[hoistOperationTime] [datetime] NULL,
	[authCode] [nvarchar](255) NULL,
	[cardName] [nvarchar](255) NULL,
	[cardType] [int] NULL,
	[clientCard] [nvarchar](255) NULL,
	[termNum] [nvarchar](255) NULL,
	[trxDate] [nvarchar](255) NULL,
	[trxTime] [nvarchar](255) NULL,
	[cardExternalId] [nvarchar](255) NULL,
	[operationId] [uniqueidentifier] NULL,
	[guestHrsIdentifier] [nvarchar](255) NULL,
	[guestName] [nvarchar](255) NULL,
	[roomNumber] [nvarchar](255) NULL,
	[chequeNumber] [nvarchar](255) NULL,
	[epitomeCard_accountNumber] [nvarchar](255) NULL,
	[epitomeOperationTime] [datetime] NULL,
 CONSTRAINT [PK_CardTransaction_b35d53d0] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [CardTransaction_date]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [CardTransaction_date] ON [dbo].[CardTransaction]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CashRegisterToken]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CashRegisterToken](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[cashRegister] [uniqueidentifier] NOT NULL,
	[createdInfo_date] [datetime] NULL,
	[createdInfo_user] [uniqueidentifier] NULL,
	[expirationDate] [datetime] NULL,
	[modifiedInfo_date] [datetime] NULL,
	[modifiedInfo_user] [uniqueidentifier] NULL,
	[status] [char](32) NOT NULL,
	[stringToken] [nvarchar](255) NULL,
 CONSTRAINT [PK_CashRegisterToken_18b84853] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ClosedSessionDocument]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ClosedSessionDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[accountShortage] [uniqueidentifier] SPARSE  NULL,
	[accountSurplus] [uniqueidentifier] SPARSE  NULL,
	[counteragentShortage] [uniqueidentifier] SPARSE  NULL,
	[counteragentSurplus] [uniqueidentifier] SPARSE  NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[session_group] [uniqueidentifier] SPARSE  NULL,
	[session_id] [uniqueidentifier] SPARSE  NULL,
	[session_number] [int] SPARSE  NULL,
 CONSTRAINT [PK_ClosedSessionDocument_133e2d49] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ClosedSessionDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [ClosedSessionDocument_dateIncoming_documentNumber] ON [dbo].[ClosedSessionDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ClosedSessionDocumentItem]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ClosedSessionDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[accountOverride] [uniqueidentifier] NULL,
	[cashFlowCategoryOverride_value] [uniqueidentifier] NULL,
	[cashFlowCategoryOverride_enabled] [tinyint] NOT NULL,
	[comment] [nvarchar](2000) NULL,
	[conceptionOverride_value] [uniqueidentifier] NULL,
	[conceptionOverride_enabled] [tinyint] NOT NULL,
	[counteragentOverride] [uniqueidentifier] NULL,
	[status] [int] NULL,
	[sumReal] [numeric](19, 9) NULL,
	[transactionId] [uniqueidentifier] NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ClosedSessionDocumentItem_ab31e321] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ConsolidatedOrderDocument]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ConsolidatedOrderDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[dateChangedAmounts] [datetime] SPARSE  NULL,
	[departmentTo] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_ConsolidatedOrderDocument_4e25181b] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ConsolidatedOrderDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:33 ******/
CREATE CLUSTERED INDEX [ConsolidatedOrderDocument_dateIncoming_documentNumber] ON [dbo].[ConsolidatedOrderDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ConsolidatedOrderItem]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ConsolidatedOrderItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ConsolidatedOrderItem_17012761] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ConsolidatedVatInvoiceItem]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ConsolidatedVatInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](255) NULL,
	[num] [int] NOT NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[sumWithVat] [numeric](19, 9) NOT NULL,
	[taxCategory] [uniqueidentifier] NULL,
	[vatPercent] [numeric](19, 9) NOT NULL,
	[vatInvoice_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ConsolidatedVatInvoiceItem_e3d97a30] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CrmCard]    Script Date: 04.08.2026 2:25:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CrmCard](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) NULL,
	[deleted] [tinyint] NULL,
	[number] [nvarchar](255) NULL,
	[track] [nvarchar](255) NOT NULL,
	[counteragent_Id] [uniqueidentifier] NULL,
 CONSTRAINT [PK_CrmCard_b6c4a898] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CrmCounteragent]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CrmCounteragent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[additionalContactsInfo] [nvarchar](255) NULL,
	[address] [nvarchar](255) NULL,
	[cellPhone] [nvarchar](255) NULL,
	[comment] [nvarchar](255) NULL,
	[deleted] [tinyint] NULL,
	[email] [nvarchar](255) NULL,
	[name] [nvarchar](255) NOT NULL,
	[nickName] [nvarchar](255) NULL,
	[phone] [nvarchar](255) NULL,
 CONSTRAINT [PK_CrmCounteragent_269c07e3] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CrmDiscountMapping]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CrmDiscountMapping](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[discountCard] [uniqueidentifier] NOT NULL,
	[crmCard_id] [uniqueidentifier] NULL,
 CONSTRAINT [PK_CrmDiscountMapping_9581285e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CrmIikoCardMapping]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CrmIikoCardMapping](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[iikoCardId] [uniqueidentifier] NOT NULL,
	[crmCard_id] [uniqueidentifier] NULL,
 CONSTRAINT [PK_CrmIikoCardMapping_230672b1] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CrmPerson]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CrmPerson](
	[birthday] [datetime] NULL,
	[firstName] [nvarchar](255) NULL,
	[gender] [int] NULL,
	[lastName] [nvarchar](255) NULL,
	[middleName] [nvarchar](255) NULL,
	[passportInfo_issueDate] [datetime] NULL,
	[passportInfo_issuer] [nvarchar](255) NULL,
	[passportInfo_number] [nvarchar](255) NULL,
	[passportInfo_series] [nvarchar](255) NULL,
	[id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_CrmPerson_1a24dc4] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CrmUserMapping]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CrmUserMapping](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[user] [uniqueidentifier] NOT NULL,
	[crmCard_id] [uniqueidentifier] NULL,
	[crmPerson_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_CrmUserMapping_a1a91a5b] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CurrencyRate]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CurrencyRate](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[currency] [uniqueidentifier] NOT NULL,
	[rate] [numeric](19, 9) NOT NULL,
 CONSTRAINT [PK_CurrencyRate_8e8c5339] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Customer]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Customer](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[birthdate] [datetime] NULL,
	[blackListInfo_blackListReason] [nvarchar](500) NULL,
	[blackListInfo_inBlackList] [tinyint] NULL,
	[cardNumber] [nvarchar](255) NULL,
	[comment] [nvarchar](500) NULL,
	[consentDateFrom] [datetime] NULL,
	[consentDateTo] [datetime] NULL,
	[counteragentInfo_accountingReasonCode] [nvarchar](4000) NULL,
	[counteragentInfo_address] [nvarchar](4000) NULL,
	[counteragentInfo_code] [nvarchar](4000) NULL,
	[counteragentInfo_fullAddress_city] [nvarchar](60) NULL,
	[counteragentInfo_fullAddress_country] [nvarchar](2) NULL,
	[counteragentInfo_fullAddress_house] [nvarchar](8) NULL,
	[counteragentInfo_fullAddress_postCode] [nvarchar](5) NULL,
	[counteragentInfo_fullAddress_region] [nvarchar](2) NULL,
	[counteragentInfo_fullAddress_street] [nvarchar](60) NULL,
	[counteragentInfo_name] [nvarchar](4000) NULL,
	[counteragentInfo_projectCode] [nvarchar](255) NULL,
	[counteragentInfo_tenderCode] [nvarchar](255) NULL,
	[counteragentInfo_recipientCode] [nvarchar](255) NULL,
	[dateCreated] [datetime] NULL,
	[dateLatestSurvey] [datetime] NULL,
	[deleted] [tinyint] NULL,
	[discountCardType] [uniqueidentifier] NULL,
	[gender] [int] NULL,
	[iikoBizInfo_iikoNetId] [uniqueidentifier] NULL,
	[initialBalance] [numeric](19, 9) NULL,
	[lastOrderDate] [datetime] NULL,
	[linkedCounteragent] [uniqueidentifier] NULL,
	[marketingSource] [uniqueidentifier] NULL,
	[name] [nvarchar](255) NOT NULL,
	[nick] [nvarchar](255) NULL,
	[personalDataConsent] [tinyint] NULL,
	[personalDataStatus] [nvarchar](10) NOT NULL,
	[processingDateFrom] [datetime] NULL,
	[processingDateTo] [datetime] NULL,
	[receivesLoyaltySystemNotifications] [tinyint] NOT NULL,
	[receivesOrderStatusNotifications] [tinyint] NOT NULL,
	[receivesPromotionalNotifications] [tinyint] NOT NULL,
	[revisionPart] [int] NOT NULL,
	[surname] [nvarchar](255) NULL,
	[timestamp] [numeric](19, 0) NOT NULL,
	[timestampId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_Customer_b08ffebc] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CustomersAddresses]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CustomersAddresses](
	[customerId] [uniqueidentifier] NOT NULL,
	[addresses_element_additionalInfo] [nvarchar](500) NULL,
	[addresses_element_building] [nvarchar](255) NULL,
	[addresses_element_doorphone] [nvarchar](255) NULL,
	[addresses_element_entrance] [nvarchar](255) NULL,
	[addresses_element_externalCartographyId] [nvarchar](255) NULL,
	[addresses_element_flat] [nvarchar](255) NULL,
	[addresses_element_floor] [nvarchar](255) NULL,
	[addresses_element_house] [nvarchar](500) NULL,
	[addresses_element_index] [nvarchar](255) NULL,
	[addresses_element_isMainAddress] [tinyint] NULL,
	[addresses_element_region] [uniqueidentifier] NULL,
	[addresses_element_street_id] [uniqueidentifier] NULL,
	[list_index] [int] NOT NULL,
	[addresses_element_line1] [nvarchar](500) NULL,
	[addresses_element_line2] [nvarchar](500) NULL,
 CONSTRAINT [PK_CustomersAddresses_54a2df6d] PRIMARY KEY CLUSTERED 
(
	[customerId] ASC,
	[list_index] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CustomersEmails]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CustomersEmails](
	[customerId] [uniqueidentifier] NOT NULL,
	[emails_element_comment] [nvarchar](255) NULL,
	[emails_element_email] [nvarchar](255) NULL,
	[emails_element_isMain] [tinyint] NOT NULL,
	[list_index] [int] NOT NULL,
 CONSTRAINT [PK_CustomersEmails_7b084ddc] PRIMARY KEY CLUSTERED 
(
	[customerId] ASC,
	[list_index] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CustomersPhones]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CustomersPhones](
	[customerId] [uniqueidentifier] NOT NULL,
	[phones_element_comment] [nvarchar](255) NULL,
	[phones_element_isMain] [tinyint] NOT NULL,
	[phones_element_phoneNumber] [nvarchar](255) NULL,
	[list_index] [int] NOT NULL,
 CONSTRAINT [PK_CustomersPhones_7d6d323b] PRIMARY KEY CLUSTERED 
(
	[customerId] ASC,
	[list_index] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DataItem]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DataItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[data] [image] NOT NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[uri] [nvarchar](255) NULL,
 CONSTRAINT [PK_DataItem_be697caf] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DBLock]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DBLock](
	[id] [uniqueidentifier] NOT NULL,
	[instanceId] [uniqueidentifier] NULL,
	[timestampRefresh] [datetimeoffset](7) NULL,
	[timestampBreak] [datetimeoffset](7) NULL,
	[info_clientIpAddress] [nvarchar](255) NULL,
	[info_hostname] [nvarchar](255) NULL,
	[info_httpPort] [int] NULL,
	[info_serverVersion] [nvarchar](255) NULL,
	[info_startupDate] [datetime] NULL,
	[owner_crmId] [nvarchar](255) NULL,
	[owner_hwId] [nvarchar](255) NULL,
	[owner_dbId] [uniqueidentifier] NULL,
	[owner_installationPath] [nvarchar](255) NULL,
 CONSTRAINT [PK_DBLock_e76bb210] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DbShrinkInfo]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DbShrinkInfo](
	[id] [uniqueidentifier] NOT NULL,
	[lastDbShrinkDate] [datetime] NULL,
	[lastDbShrinkExecutionEndTime] [datetime] NULL,
 CONSTRAINT [PK_DbShrinkInfo_46e0b780] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DBVersion]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DBVersion](
	[serverId] [uniqueidentifier] NOT NULL,
	[dbVendor] [nvarchar](255) NULL,
	[maxRevisionWithoutDeletedEntities] [int] NULL,
	[revision] [int] NULL,
	[serverVersion] [nvarchar](255) NULL,
	[userCountry] [nvarchar](255) NULL,
	[userLanguage] [nvarchar](255) NULL,
 CONSTRAINT [PK_DBVersion_3ae06908] PRIMARY KEY NONCLUSTERED 
(
	[serverId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeletedEntity]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeletedEntity](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[created] [datetime] NOT NULL,
	[deletedEntityId] [uniqueidentifier] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[entityType] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_DeletedEntity_8b68ecf8] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [DeletedEntity_created]    Script Date: 04.08.2026 2:25:34 ******/
CREATE CLUSTERED INDEX [DeletedEntity_created] ON [dbo].[DeletedEntity]
(
	[created] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Delivery]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Delivery](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[actualTime] [datetime] NULL,
	[address_additionalInfo] [nvarchar](500) NULL,
	[address_building] [nvarchar](255) NULL,
	[address_doorphone] [nvarchar](255) NULL,
	[address_entrance] [nvarchar](255) NULL,
	[address_externalCartographyId] [nvarchar](255) NULL,
	[address_flat] [nvarchar](255) NULL,
	[address_floor] [nvarchar](255) NULL,
	[address_house] [nvarchar](500) NULL,
	[address_index] [nvarchar](255) NULL,
	[address_region] [uniqueidentifier] NULL,
	[anonymized] [tinyint] NOT NULL,
	[avgCourierMark] [float] NULL,
	[avgFoodMark] [float] NULL,
	[avgMark] [float] NULL,
	[avgOperatorMark] [float] NULL,
	[billPrinted] [tinyint] NOT NULL,
	[billTime] [datetime] NULL,
	[cancelTime] [datetime] NULL,
	[closeTime] [datetime] NULL,
	[comment] [nvarchar](500) NULL,
	[confirmTime] [datetime] NULL,
	[cookingFinishTime] [datetime] NULL,
	[cookingStartedTime] [datetime] NULL,
	[courier] [uniqueidentifier] NULL,
	[createTime] [datetime] NOT NULL,
	[customerEmail] [nvarchar](255) NULL,
	[customerName] [nvarchar](255) NULL,
	[customerPhoneNumber] [nvarchar](255) NULL,
	[date] [datetime] NOT NULL,
	[deliveryCancelCause] [uniqueidentifier] NULL,
	[deliveryCancelComment] [nvarchar](255) NULL,
	[deliveryDurationInMinutes] [numeric](19, 0) NULL,
	[deliveryOperator] [uniqueidentifier] NULL,
	[department] [uniqueidentifier] NULL,
	[ecsData_courierComment] [nvarchar](500) NULL,
	[ecsData_courierName] [nvarchar](255) NULL,
	[ecsData_courierPhone] [nvarchar](50) NULL,
	[ecsData_serviceId] [uniqueidentifier] NULL,
	[ecsData_serviceName] [nvarchar](255) NULL,
	[group] [uniqueidentifier] NOT NULL,
	[indexInCourierRoute] [int] NULL,
	[isCourierSelectedManually] [tinyint] NOT NULL,
	[isCustomerAuthorizedInIikoBiz] [tinyint] NOT NULL,
	[isPrintedBillActual] [tinyint] NOT NULL,
	[isSelfService] [tinyint] NOT NULL,
	[lastDefaultTerminalDeliveryDurationInMinutes] [numeric](19, 0) NULL,
	[latitude] [float] NULL,
	[longitude] [float] NULL,
	[marketingSource] [uniqueidentifier] NULL,
	[movedToDeliveryId] [uniqueidentifier] NULL,
	[number] [int] NOT NULL,
	[opinionComment] [nvarchar](1000) NULL,
	[orderId] [uniqueidentifier] NULL,
	[payedSum] [numeric](19, 9) NULL,
	[personsCount] [int] NOT NULL,
	[predictedCookingCompleteTime] [datetime] NULL,
	[predictedDeliveryTime] [datetime] NULL,
	[printTime] [datetime] NULL,
	[problem_hasProblem] [tinyint] NOT NULL,
	[problem_problem] [nvarchar](1000) NULL,
	[sendTime] [datetime] NULL,
	[sourceId] [uniqueidentifier] NULL,
	[sourceKey] [nvarchar](255) NULL,
	[splitBetweenPersons] [tinyint] NOT NULL,
	[status] [int] NOT NULL,
	[syncRevision] [int] NOT NULL,
	[zone] [nvarchar](255) NULL,
	[address_street_id] [uniqueidentifier] NULL,
	[customerId] [uniqueidentifier] NULL,
	[address_line1] [nvarchar](500) NULL,
	[address_line2] [nvarchar](500) NULL,
	[movedFromDeliveryId] [uniqueidentifier] NULL,
	[movedFromTerminalGroupId] [uniqueidentifier] NULL,
	[movedToTerminalGroupId] [uniqueidentifier] NULL,
	[isAsap] [tinyint] NULL,
	[packedTime] [datetime] NULL,
	[customerPhoneExtension] [nvarchar](255) NULL,
 CONSTRAINT [PK_Delivery_f1c83391] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [Delivery_date]    Script Date: 04.08.2026 2:25:34 ******/
CREATE CLUSTERED INDEX [Delivery_date] ON [dbo].[Delivery]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryAppliedManualCondition]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryAppliedManualCondition](
	[deliveryOrderId] [uniqueidentifier] NOT NULL,
	[appliedManualConditions_element_conditionId] [uniqueidentifier] NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryCourierLocation]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryCourierLocation](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[accuracy] [int] NOT NULL,
	[courier] [uniqueidentifier] NOT NULL,
	[date] [datetime] NOT NULL,
	[latitude] [numeric](19, 9) NOT NULL,
	[longitude] [numeric](19, 9) NOT NULL,
 CONSTRAINT [PK_DeliveryCourierLocation_a79e7c48] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryCourierLocation_date]    Script Date: 04.08.2026 2:25:34 ******/
CREATE CLUSTERED INDEX [DeliveryCourierLocation_date] ON [dbo].[DeliveryCourierLocation]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryDiscount]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryDiscount](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[cardNumber] [nvarchar](255) NULL,
	[discountCardId] [uniqueidentifier] NULL,
	[discountCardType] [uniqueidentifier] NOT NULL,
	[discountOrIncreaseSum] [numeric](19, 9) NOT NULL,
	[deliveryOrder_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DeliveryDiscount_4a767e25] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryModifiers]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryModifiers](
	[deliveryOrderItemId] [uniqueidentifier] NOT NULL,
	[modifiers_element_amount] [numeric](19, 9) NULL,
	[modifiers_element_common] [tinyint] NULL,
	[modifiers_element_deleted] [tinyint] NULL,
	[modifiers_element_deletionMethod_comment] [nvarchar](1000) NULL,
	[modifiers_element_deletionMethod_removalType] [uniqueidentifier] NULL,
	[modifiers_element_id] [uniqueidentifier] NULL,
	[modifiers_element_modifierGroup] [uniqueidentifier] NULL,
	[modifiers_element_price] [numeric](19, 9) NULL,
	[modifiers_element_pricePredefined] [tinyint] NULL,
	[modifiers_element_product] [uniqueidentifier] NULL,
	[modifiers_element_size] [uniqueidentifier] NULL,
	[modifiers_element_sum] [numeric](19, 9) NULL,
	[list_index] [int] NOT NULL,
 CONSTRAINT [PK_DeliveryModifiers_578290cf] PRIMARY KEY NONCLUSTERED 
(
	[deliveryOrderItemId] ASC,
	[list_index] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryOrderComboInfo]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryOrderComboInfo](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[amount] [int] NULL,
	[name] [nvarchar](255) NULL,
	[price] [numeric](19, 9) NULL,
	[programId] [uniqueidentifier] NULL,
	[sourceId] [uniqueidentifier] NULL,
	[deliveryOrder_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DeliveryOrderComboInfo_59151f07] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryOrderGuest]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryOrderGuest](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[name] [nvarchar](255) NULL,
	[deliveryOrder_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DeliveryOrderGuest_84e2bf9c] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryOrderItem]    Script Date: 04.08.2026 2:25:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryOrderItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[comboGroupId] [uniqueidentifier] NULL,
	[comboId] [uniqueidentifier] NULL,
	[comment] [nvarchar](255) NULL,
	[deleted] [tinyint] NULL,
	[deletionMethod_comment] [nvarchar](1000) NULL,
	[deletionMethod_removalType] [uniqueidentifier] NULL,
	[guestId] [uniqueidentifier] NULL,
	[mainPiece] [tinyint] NULL,
	[orderItemsAggregationId] [uniqueidentifier] NULL,
	[price] [numeric](19, 9) NOT NULL,
	[pricePredefined] [tinyint] NULL,
	[product] [uniqueidentifier] NOT NULL,
	[rank] [int] NULL,
	[size] [uniqueidentifier] NULL,
	[splitted] [tinyint] NULL,
	[status] [int] NOT NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[waiter] [uniqueidentifier] NULL,
	[deliveryOrder_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DeliveryOrderItem_5c126b43] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryOrderItem_deliveryOrder]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [DeliveryOrderItem_deliveryOrder] ON [dbo].[DeliveryOrderItem]
(
	[deliveryOrder_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryPaymentItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryPaymentItem](
	[dtype] [nvarchar](5) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[additionalData] [nvarchar](255) NULL,
	[chequeAdditionalInfo_email] [nvarchar](255) NULL,
	[chequeAdditionalInfo_needReceipt] [tinyint] NULL,
	[chequeAdditionalInfo_phone] [nvarchar](255) NULL,
	[chequeAdditionalInfo_settlementPlace] [nvarchar](255) NULL,
	[isExternal] [tinyint] NULL,
	[isFiscalizedExternally] [tinyint] NULL,
	[isPreliminary] [tinyint] NULL,
	[isPrepay] [tinyint] NULL,
	[isProcessedExternally] [tinyint] NULL,
	[organizationDetailsInfo_accountingReasonCode] [nvarchar](4000) NULL,
	[organizationDetailsInfo_address] [nvarchar](4000) NULL,
	[organizationDetailsInfo_code] [nvarchar](4000) NULL,
	[organizationDetailsInfo_customerId] [uniqueidentifier] NULL,
	[organizationDetailsInfo_name] [nvarchar](4000) NULL,
	[paymentType] [uniqueidentifier] NOT NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[cardNumber] [nvarchar](255) NULL,
	[customData] [ntext] NULL,
	[discount] [numeric](19, 9) NULL,
	[externalId] [nvarchar](255) NULL,
	[externalIdType] [int] NULL,
	[ratio] [int] NULL,
	[reason] [nvarchar](255) NULL,
	[counteragent] [uniqueidentifier] NULL,
	[count] [int] NULL,
	[credential] [nvarchar](255) NULL,
	[searchScope] [int] NULL,
	[deliveryOrder_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DeliveryPaymentItem_cec774a0] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryStopListItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryStopListItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[balance] [numeric](19, 9) NOT NULL,
	[deleted] [tinyint] NOT NULL,
	[deliveryTerminalId] [uniqueidentifier] NULL,
	[product] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DeliveryStopListItem_cc13a416] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryTerminal]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryTerminal](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[address] [nvarchar](255) NULL,
	[clientPriceCategory] [uniqueidentifier] NULL,
	[conception] [uniqueidentifier] NULL,
	[customName] [nvarchar](255) NOT NULL,
	[deleted] [tinyint] NULL,
	[departmentEntityId] [uniqueidentifier] NULL,
	[fullRMSVersion] [nvarchar](255) NULL,
	[groupId] [uniqueidentifier] NULL,
	[name] [nvarchar](255) NULL,
	[protocolVersion] [int] NULL,
	[registered] [tinyint] NULL,
	[technicalInformation] [nvarchar](1000) NULL,
	[terminal] [uniqueidentifier] NULL,
	[terminalSettings_averageDeliveryProcessingTimeInMinutes] [int] NOT NULL,
	[averageDeliverySelfServiceProcessingTimeInMin] [int] NULL,
	[timeZoneInfo_current_local] [nvarchar](255) NULL,
	[timeZoneInfo_current_utc] [numeric](19, 0) NULL,
	[timeZoneInfo_future_local] [nvarchar](255) NULL,
	[timeZoneInfo_future_utc] [numeric](19, 0) NULL,
	[timeZoneInfo_tzId] [nvarchar](255) NULL,
	[timeZoneInfo_windowsId] [nvarchar](255) NULL,
 CONSTRAINT [PK_DeliveryTerminal_9f1f864a] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeliveryTerminalExchangeState]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeliveryTerminalExchangeState](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[knownRevision] [int] NOT NULL,
	[lastExchangeDate] [datetime] NULL,
	[terminalId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_DeliveryTerminalExchangeState_92286203] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DetailedVatInvoice]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DetailedVatInvoice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[cashRegisterNumber] [int] SPARSE  NULL,
	[customerId] [uniqueidentifier] NOT NULL,
	[department] [uniqueidentifier] NOT NULL,
	[fiscalChequeNumber] [nvarchar](255) SPARSE  NULL,
	[fiscalRegisterNumber] [nvarchar](255) SPARSE  NULL,
	[orderNumber] [int] SPARSE  NULL,
	[sessionNumber] [int] SPARSE  NULL,
	[closeTime] [datetime] NOT NULL,
	[fpm] [tinyint] NOT NULL,
	[orderId] [uniqueidentifier] NOT NULL,
	[payments] [ntext] NOT NULL,
	[storned] [tinyint] NOT NULL,
	[paDocumentType] [nvarchar](40) NULL,
	[paDocumentNumber] [nvarchar](20) NULL,
	[cupCode] [nvarchar](15) NULL,
	[cigCode] [nvarchar](15) NULL,
	[splitVat] [tinyint] NOT NULL,
 CONSTRAINT [PK_DetailedVatInvoice_4bafeea2] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [DetailedVatInvoice_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [DetailedVatInvoice_dateIncoming_documentNumber] ON [dbo].[DetailedVatInvoice]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DetailedVatInvoiceItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DetailedVatInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[description] [nvarchar](255) NULL,
	[num] [int] NOT NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[sumWithVat] [numeric](19, 9) NOT NULL,
	[taxCategory] [uniqueidentifier] NULL,
	[vatPercent] [numeric](19, 9) NOT NULL,
	[discountSum] [numeric](19, 9) NOT NULL,
	[dishAmount] [numeric](19, 9) NOT NULL,
	[dishSum] [numeric](19, 9) NOT NULL,
	[increaseSum] [numeric](19, 9) NOT NULL,
	[positionCode] [nvarchar](255) NULL,
	[vatInvoice_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DetailedVatInvoiceItem_38ec4420] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DisassembleDocument]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DisassembleDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[storeFrom] [uniqueidentifier] SPARSE  NULL,
	[storeTo] [uniqueidentifier] SPARSE  NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[amountUnit] [uniqueidentifier] SPARSE  NULL,
	[containerId] [uniqueidentifier] SPARSE  NULL,
	[product] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DisassembleDocument_724dc6ad] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [DisassembleDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [DisassembleDocument_dateIncoming_documentNumber] ON [dbo].[DisassembleDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DisassembleDocumentItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DisassembleDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[mainProductAmountPercent] [numeric](19, 9) NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_DisassembleDocumentItem_16cd4c3] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DocumentNumberingState]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DocumentNumberingState](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[currentAutoIncrementValue] [int] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[documentType] [char](32) NOT NULL,
	[modified] [datetime] NULL,
	[year] [int] NOT NULL,
 CONSTRAINT [PK_DocumentNumberingState_eb042214] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EdiOrderDocument]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EdiOrderDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[additionalItems] [ntext] NULL,
	[confirmedDeliveryDate] [datetime] SPARSE  NULL,
	[currency] [nvarchar](255) SPARSE  NULL,
	[deliveryDate] [datetime] SPARSE  NULL,
	[ediId_date] [datetime] SPARSE  NULL,
	[ediId_number] [nvarchar](255) SPARSE  NULL,
	[ediStatus] [int] NOT NULL,
	[ediSystem] [uniqueidentifier] NOT NULL,
	[isEdiDocument] [tinyint] NOT NULL,
	[payer] [uniqueidentifier] SPARSE  NULL,
	[promoAction] [nvarchar](255) SPARSE  NULL,
	[seller] [uniqueidentifier] NOT NULL,
	[sentDate] [datetime] SPARSE  NULL,
	[store] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EdiOrderDocument_45ff1cf9] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EdiOrderDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [EdiOrderDocument_dateIncoming_documentNumber] ON [dbo].[EdiOrderDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EdiOrderItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EdiOrderItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[amountInPrimaryUnits] [numeric](19, 9) NULL,
	[comment] [nvarchar](255) NULL,
	[confirmedAmount] [numeric](19, 9) NULL,
	[confirmedAmountInPrimaryUnits] [numeric](19, 9) NULL,
	[confirmedComment] [nvarchar](255) NULL,
	[confirmedEdiAmountUnit] [uniqueidentifier] NULL,
	[confirmedOnePlaceAmount] [numeric](19, 9) NULL,
	[confirmedPrice] [numeric](19, 9) NULL,
	[confirmedPriceVAT] [numeric](19, 9) NULL,
	[confirmedSum] [numeric](19, 9) NULL,
	[confirmedSumVAT] [numeric](19, 9) NULL,
	[ediAmountUnit] [uniqueidentifier] NULL,
	[onePlaceAmount] [numeric](19, 9) NULL,
	[price] [numeric](19, 9) NULL,
	[priceWithVAT] [numeric](19, 9) NULL,
	[savedExternalProductCode] [nvarchar](255) NULL,
	[savedInternalProductCode] [nvarchar](255) NULL,
	[status] [int] NOT NULL,
	[sum] [numeric](19, 9) NULL,
	[sumWithVAT] [numeric](19, 9) NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[ediOrder_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EdiOrderItem_1097c26d] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisBalanceDocument]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisBalanceDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[balanceStatus] [nvarchar](255) NOT NULL,
	[balanceType] [nvarchar](255) NOT NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[ticketRejectData] [ntext] NULL,
 CONSTRAINT [PK_EgaisBalanceDocument_497657a9] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisBalanceDocument_dateIncoming]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [EgaisBalanceDocument_dateIncoming] ON [dbo].[EgaisBalanceDocument]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisBalanceDocumentItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisBalanceDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[aRegId] [nvarchar](255) NULL,
	[bRegId] [nvarchar](255) NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisBalanceDocumentItem_4afb19f0] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisBTicket]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisBTicket](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[egaisFixDate] [datetime] NULL,
	[egaisFixNumber] [nvarchar](255) NULL,
	[identity] [nvarchar](255) NULL,
	[items] [ntext] NULL,
	[recipientInfo] [ntext] NULL,
	[senderRarId] [nvarchar](255) NULL,
	[shipperInfo] [ntext] NULL,
	[sourceRarId] [nvarchar](255) NULL,
	[supplierInfo] [ntext] NULL,
	[wbDate] [datetime] NULL,
	[wbNumber] [nvarchar](255) NULL,
	[wbRegId] [nvarchar](255) NULL,
 CONSTRAINT [PK_EgaisBTicket_98463e93] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisBTicket_wbDate_wbNumber]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [EgaisBTicket_wbDate_wbNumber] ON [dbo].[EgaisBTicket]
(
	[wbDate] ASC,
	[wbNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisIncomingInvoice]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisIncomingInvoice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[identityId] [nvarchar](255) NULL,
	[invoiceBase] [ntext] NULL,
	[packed] [tinyint] NULL,
	[recipientInfo] [ntext] NOT NULL,
	[shipper] [uniqueidentifier] NULL,
	[shipperInfo] [ntext] NOT NULL,
	[shippingDate] [datetime] NULL,
	[supplierInfo] [ntext] NULL,
	[transportInfo] [ntext] NULL,
	[versionInvoice] [nvarchar](10) NOT NULL,
	[wbDate] [datetime] NULL,
	[wbNumber] [nvarchar](255) NULL,
	[wbRegId] [nvarchar](255) NULL,
	[confirmStatus] [nvarchar](255) NOT NULL,
	[egaisConfirmData] [ntext] NULL,
	[senderRarId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](255) NOT NULL,
	[supplierConfirmData] [ntext] NULL,
	[ticketActProcessData] [ntext] NULL,
	[ticketActReceiveData] [ntext] NULL,
	[useMarkConfirm] [tinyint] NOT NULL,
 CONSTRAINT [PK_EgaisIncomingInvoice_1547ccd8] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisIncomingInvoice_wbDate_wbNumber]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [EgaisIncomingInvoice_wbDate_wbNumber] ON [dbo].[EgaisIncomingInvoice]
(
	[wbDate] ASC,
	[wbNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisIncomingInvoiceItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisIncomingInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[aRegId] [nvarchar](255) NOT NULL,
	[bRegId] [nvarchar](255) NULL,
	[exciseBs] [numeric](19, 9) NULL,
	[exciseDate] [datetime] NULL,
	[exciseNumber] [nvarchar](255) NULL,
	[exciseSum] [numeric](19, 9) NULL,
	[identityId] [nvarchar](255) NOT NULL,
	[marksByBox] [ntext] NULL,
	[marksNotConfirmed] [ntext] NULL,
	[originalClient] [ntext] NULL,
	[packId] [nvarchar](255) NULL,
	[party] [nvarchar](255) NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisIncomingInvoiceItem_3cb0e0ab] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkBalanceQuery]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkBalanceQuery](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[parameters] [ntext] NOT NULL,
 CONSTRAINT [PK_EgaisMarkBalanceQuery_36ca3f6f] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkBalanceQuery_dateIncoming]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [EgaisMarkBalanceQuery_dateIncoming] ON [dbo].[EgaisMarkBalanceQuery]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkBalanceQueryItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkBalanceQueryItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[bRegId] [nvarchar](255) NOT NULL,
	[marks] [ntext] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
	[volume] [int] NULL,
 CONSTRAINT [PK_EgaisMarkBalanceQueryItem_f8ba8d0f] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkConfirm]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkConfirm](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[egaisInvoiceId] [uniqueidentifier] NOT NULL,
	[lockedByTerminal] [uniqueidentifier] NULL,
	[markStatus] [nvarchar](255) NOT NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_EgaisMarkConfirm_5995d16d] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkConfirm_dateIncoming]    Script Date: 04.08.2026 2:25:35 ******/
CREATE CLUSTERED INDEX [EgaisMarkConfirm_dateIncoming] ON [dbo].[EgaisMarkConfirm]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkConfirmItem]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkConfirmItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[bRegId] [nvarchar](255) NOT NULL,
	[marks] [ntext] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisMarkConfirmItem_a96267af] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkFirstPartialWriteoffInfo]    Script Date: 04.08.2026 2:25:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkFirstPartialWriteoffInfo](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[documentId] [uniqueidentifier] NOT NULL,
	[documentItemId] [uniqueidentifier] NOT NULL,
	[documentType] [nvarchar](30) NOT NULL,
	[bRegId] [nvarchar](64) NULL,
	[egaisMark] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](64) NULL,
 CONSTRAINT [PK_EgaisMarkFirstPartialWriteoffInfo_9bfde2aa] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkFix]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkFix](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
 CONSTRAINT [PK_EgaisMarkFix_39c14509] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkFix_dateIncoming]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisMarkFix_dateIncoming] ON [dbo].[EgaisMarkFix]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkFixItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkFixItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[bRegId] [nvarchar](255) NOT NULL,
	[marks] [ntext] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisMarkFixItem_2a281b0c] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkState]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkState](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[alcCode] [nvarchar](64) NULL,
	[dateTo] [datetime] NOT NULL,
	[egaisMarkFields] [nvarchar](40) NULL,
	[bRegId] [nvarchar](64) NULL,
	[egaisMark] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](64) NULL,
	[markCount] [int] NOT NULL,
	[volumeRemained] [int] NULL,
 CONSTRAINT [PK_EgaisMarkState_b8b6e80d] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisMarkState_dateTo_sourceRarId]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisMarkState_dateTo_sourceRarId] ON [dbo].[EgaisMarkState]
(
	[dateTo] ASC,
	[sourceRarId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkTableItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkTableItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[dateToLimit] [datetime] NOT NULL,
	[documentId] [uniqueidentifier] NOT NULL,
	[documentItemId] [uniqueidentifier] NOT NULL,
	[documentItemNumber] [int] NOT NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[documentRegId] [nvarchar](64) NULL,
	[documentType] [nvarchar](30) NOT NULL,
	[egaisMarkFields] [nvarchar](40) NULL,
	[bRegId] [nvarchar](64) NULL,
	[egaisMark] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](64) NULL,
	[markCount] [int] NOT NULL,
	[deltaVolume] [int] NULL,
 CONSTRAINT [PK_EgaisMarkTableItem_858754cc] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisMarkTableItem_dateTo_sourceRarId]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisMarkTableItem_dateTo_sourceRarId] ON [dbo].[EgaisMarkTableItem]
(
	[dateTo] ASC,
	[sourceRarId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkUnFix]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkUnFix](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
 CONSTRAINT [PK_EgaisMarkUnFix_2e567232] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkUnFix_dateIncoming]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisMarkUnFix_dateIncoming] ON [dbo].[EgaisMarkUnFix]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisMarkUnFixItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisMarkUnFixItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[bRegId] [nvarchar](255) NOT NULL,
	[marks] [ntext] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisMarkUnFixItem_1c27f7c4] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisOrganizationEntity]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisOrganizationEntity](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[clientRegId] [nvarchar](64) NOT NULL,
	[dateUpdatedOrgInfoV1] [datetime] NULL,
	[dateUpdatedOrgInfoV2] [datetime] NULL,
	[dateUpdatedVersionWb] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[flAddressList] [ntext] NULL,
	[fullName] [nvarchar](255) NOT NULL,
	[licenseNumberPrintText] [nvarchar](255) NULL,
	[modified_date] [datetime] NULL,
	[modified_user] [uniqueidentifier] NULL,
	[orgInfoV1] [ntext] NULL,
	[orgInfoV2] [ntext] NULL,
	[orgState] [nvarchar](255) NULL,
	[versionWb] [nvarchar](255) NULL,
 CONSTRAINT [PK_EgaisOrganizationEntity_ee84ec32] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisOutgoingInvoice]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisOutgoingInvoice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[identityId] [nvarchar](255) NULL,
	[invoiceBase] [ntext] NULL,
	[packed] [tinyint] NULL,
	[recipientInfo] [ntext] NOT NULL,
	[shipper] [uniqueidentifier] NULL,
	[shipperInfo] [ntext] NOT NULL,
	[shippingDate] [datetime] NULL,
	[supplierInfo] [ntext] NULL,
	[transportInfo] [ntext] NULL,
	[versionInvoice] [nvarchar](10) NOT NULL,
	[wbDate] [datetime] NULL,
	[wbNumber] [nvarchar](255) NULL,
	[wbRegId] [nvarchar](255) NULL,
	[confirmStatus] [nvarchar](255) NOT NULL,
	[destinationRarId] [nvarchar](255) NOT NULL,
	[egaisConfirmData] [ntext] NULL,
	[outgoingInvoiceType] [nvarchar](20) NOT NULL,
	[recipientConfirmData] [ntext] NULL,
	[replyIdAct] [nvarchar](255) NULL,
	[senderRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](255) NOT NULL,
	[ticketChangedProcessData] [ntext] NULL,
	[ticketChangedReceiveData] [ntext] NULL,
	[ticketSentProcessData] [ntext] NULL,
	[ticketSentReceiveData] [ntext] NULL,
 CONSTRAINT [PK_EgaisOutgoingInvoice_7be3075c] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisOutgoingInvoice_wbDate_wbNumber]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisOutgoingInvoice_wbDate_wbNumber] ON [dbo].[EgaisOutgoingInvoice]
(
	[wbDate] ASC,
	[wbNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisOutgoingInvoiceItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisOutgoingInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[aRegId] [nvarchar](255) NOT NULL,
	[bRegId] [nvarchar](255) NULL,
	[exciseBs] [numeric](19, 9) NULL,
	[exciseDate] [datetime] NULL,
	[exciseNumber] [nvarchar](255) NULL,
	[exciseSum] [numeric](19, 9) NULL,
	[identityId] [nvarchar](255) NOT NULL,
	[marksByBox] [ntext] NULL,
	[marksNotConfirmed] [ntext] NULL,
	[originalClient] [ntext] NULL,
	[packId] [nvarchar](255) NULL,
	[party] [nvarchar](255) NULL,
	[prevBRegId] [nvarchar](255) NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisOutgoingInvoiceItem_5295116c] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisProductEntity]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisProductEntity](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[alcCode] [nvarchar](64) NOT NULL,
	[dateUpdatedProductInfoV1] [datetime] NULL,
	[dateUpdatedProductInfoV2] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[fullName] [nvarchar](255) NOT NULL,
	[minimumRetailPrice] [numeric](19, 9) NULL,
	[modified_date] [datetime] NULL,
	[modified_user] [uniqueidentifier] NULL,
	[productInfoV1] [ntext] NULL,
	[productInfoV2] [ntext] NULL,
 CONSTRAINT [PK_EgaisProductEntity_8b253c20] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryFormA]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryFormA](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[parameters] [ntext] NOT NULL,
	[versionQuery] [nvarchar](10) NOT NULL,
	[aRegId] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_EgaisQueryFormA_d8a3f453] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryFormA_dateIncoming]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisQueryFormA_dateIncoming] ON [dbo].[EgaisQueryFormA]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryFormAItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryFormAItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisQueryFormAItem_69376a77] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryNotAnsweredInvoices]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryNotAnsweredInvoices](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[consignee] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_EgaisQueryNotAnsweredInvoices_8b208dff] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryNotAnsweredInvoices_dateIncoming]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisQueryNotAnsweredInvoices_dateIncoming] ON [dbo].[EgaisQueryNotAnsweredInvoices]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryNotAnsweredInvoicesItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryNotAnsweredInvoicesItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[senderRarId] [nvarchar](255) NOT NULL,
	[wbDate] [datetime] NOT NULL,
	[wbNumber] [nvarchar](255) NOT NULL,
	[wbRegId] [nvarchar](255) NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisQueryNotAnsweredInvoicesItem_efdfdfd1] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryOrganization]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryOrganization](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[parameters] [ntext] NOT NULL,
	[versionQuery] [nvarchar](10) NOT NULL,
	[queryOrganizationType] [nvarchar](20) NOT NULL,
 CONSTRAINT [PK_EgaisQueryOrganization_b27d5b8d] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryOrganization_dateIncoming]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisQueryOrganization_dateIncoming] ON [dbo].[EgaisQueryOrganization]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryOrganizationItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryOrganizationItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[flAddressList] [ntext] NULL,
	[orgInfo] [ntext] NOT NULL,
	[orgState] [nvarchar](255) NULL,
	[versionWb] [nvarchar](255) NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisQueryOrganizationItem_8c0167d0] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryProduct]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryProduct](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[parameters] [ntext] NOT NULL,
	[versionQuery] [nvarchar](10) NOT NULL,
 CONSTRAINT [PK_EgaisQueryProduct_b90bd040] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryProduct_dateIncoming]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisQueryProduct_dateIncoming] ON [dbo].[EgaisQueryProduct]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryProductItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryProductItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisQueryProductItem_8fb41a3b] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryResendInvoice]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryResendInvoice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[wbRegId] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_EgaisQueryResendInvoice_1daf417f] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryResendInvoice_dateIncoming]    Script Date: 04.08.2026 2:25:36 ******/
CREATE CLUSTERED INDEX [EgaisQueryResendInvoice_dateIncoming] ON [dbo].[EgaisQueryResendInvoice]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisQueryResendInvoiceItem]    Script Date: 04.08.2026 2:25:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisQueryResendInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisQueryResendInvoiceItem_e70933bd] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisReplyFormA]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisReplyFormA](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[aRegId] [nvarchar](255) NOT NULL,
	[bottlingDate] [datetime] NULL,
	[dateUpdated] [datetime] NULL,
	[egaisDate] [datetime] NULL,
	[egaisNumber] [nvarchar](255) NULL,
	[gtdDate] [datetime] NULL,
	[gtdNumber] [nvarchar](255) NULL,
	[originalClient] [ntext] NULL,
	[originalDocDate] [datetime] NULL,
	[originalDocNumber] [nvarchar](255) NULL,
	[productInfo] [ntext] NOT NULL,
	[quantity] [numeric](19, 9) NULL,
 CONSTRAINT [PK_EgaisReplyFormA_d0139a16] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisRequestRepeal]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisRequestRepeal](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[counteragentConfirmData] [ntext] NULL,
	[repealStatus] [nvarchar](10) NOT NULL,
	[repealedDocumentId] [uniqueidentifier] NULL,
	[repealedDocumentType] [nvarchar](30) NOT NULL,
	[repealedIncomingRequestNumber] [nvarchar](255) NULL,
	[repealedRegId] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_EgaisRequestRepeal_24425eb1] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisRequestRepeal_dateIncoming]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisRequestRepeal_dateIncoming] ON [dbo].[EgaisRequestRepeal]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisRequestRepealItem]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisRequestRepealItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[bRegId] [nvarchar](255) NULL,
	[marks] [ntext] NULL,
	[document_id] [uniqueidentifier] NOT NULL,
	[volume] [int] NULL,
 CONSTRAINT [PK_EgaisRequestRepealItem_919a475] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisSaleEvent]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisSaleEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[barman] [uniqueidentifier] NULL,
	[cashRegister] [nvarchar](255) NULL,
	[dateFirstTry] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentId] [uniqueidentifier] NULL,
	[documentNumber] [nvarchar](255) NULL,
	[number] [nvarchar](255) NULL,
	[processingError] [nvarchar](255) NULL,
	[shift] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](10) NOT NULL,
 CONSTRAINT [PK_EgaisSaleEvent_15923a8] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [EgaisSaleEvent_date]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisSaleEvent_date] ON [dbo].[EgaisSaleEvent]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisSaleEventItem]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisSaleEventItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[deleted] [tinyint] NOT NULL,
	[ean] [nvarchar](255) NOT NULL,
	[egaisAlcCode] [nvarchar](255) NULL,
	[egaisMarkCode] [nvarchar](255) NOT NULL,
	[price] [numeric](19, 9) NOT NULL,
	[processingError] [nvarchar](255) NULL,
	[product] [uniqueidentifier] NOT NULL,
	[saleEventId] [uniqueidentifier] NOT NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](10) NOT NULL,
	[volume] [int] NULL,
 CONSTRAINT [PK_EgaisSaleEventItem_4955f819] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [EgaisSaleEventItem_date]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisSaleEventItem_date] ON [dbo].[EgaisSaleEventItem]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisSalesDocument]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisSalesDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
 CONSTRAINT [PK_EgaisSalesDocument_e8d9b1a6] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisSalesDocument_dateIncoming]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisSalesDocument_dateIncoming] ON [dbo].[EgaisSalesDocument]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisSalesDocumentItem]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisSalesDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[bRegId] [nvarchar](255) NULL,
	[mark_mark] [nvarchar](255) NULL,
	[saleSum] [numeric](19, 9) NULL,
	[volume] [int] NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisSalesDocumentItem_99dfa9d2] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisShopIncoming]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisShopIncoming](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[egaisIncomingType] [nvarchar](40) NOT NULL,
	[mixedWriteoffRegId] [nvarchar](255) NULL,
 CONSTRAINT [PK_EgaisShopIncoming_b8a2c697] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopIncoming_dateIncoming]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisShopIncoming_dateIncoming] ON [dbo].[EgaisShopIncoming]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisShopIncomingItem]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisShopIncomingItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisShopIncomingItem_3b83a7ba] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisShopIncomingLink]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisShopIncomingLink](
	[id] [uniqueidentifier] NOT NULL,
	[internalDocumentDate] [datetime] NOT NULL,
	[internalDocumentId] [uniqueidentifier] NOT NULL,
	[internalDocumentNumber] [nvarchar](255) NOT NULL,
	[internalDocumentType] [char](32) NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisShopIncomingLink_d91e67e3] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisShopTransfer]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisShopTransfer](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[direction] [nvarchar](10) NOT NULL,
 CONSTRAINT [PK_EgaisShopTransfer_1fa079c7] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopTransfer_dateIncoming]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisShopTransfer_dateIncoming] ON [dbo].[EgaisShopTransfer]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisShopTransferItem]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisShopTransferItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[bRegId] [nvarchar](255) NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisShopTransferItem_396c1744] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisShopWriteoff]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisShopWriteoff](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[comment] [ntext] NULL,
	[confirmedComment] [ntext] NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentNumber] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NULL,
	[dateProcessedByEgais] [datetime] NULL,
	[departmentId] [uniqueidentifier] NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[replyId] [nvarchar](255) NULL,
	[sentErrorMessage] [ntext] NULL,
	[sentFileName] [ntext] NULL,
	[documentRegId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NOT NULL,
	[status] [nvarchar](40) NOT NULL,
	[ticketProcessData] [ntext] NULL,
	[ticketReceiveData] [ntext] NULL,
	[dateLastAutomaticUpdate] [datetime] NULL,
	[egaisRegister] [nvarchar](10) NOT NULL,
	[egaisWriteoffType] [nvarchar](40) NOT NULL,
	[groupId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_EgaisShopWriteoff_564698bd] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopWriteoff_dateIncoming]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisShopWriteoff_dateIncoming] ON [dbo].[EgaisShopWriteoff]
(
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisShopWriteoffItem]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisShopWriteoffItem](
	[id] [uniqueidentifier] NOT NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[amount] [numeric](19, 9) NULL,
	[amountInPrimaryUnit] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[comment] [ntext] NULL,
	[containerId] [uniqueidentifier] NULL,
	[incomingAmount] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[price] [numeric](19, 9) NULL,
	[product] [uniqueidentifier] NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[productInfo] [ntext] NOT NULL,
	[bRegId] [nvarchar](255) NULL,
	[internalWriteoffLiters] [numeric](19, 9) NULL,
	[marks] [ntext] NULL,
	[sumSale] [numeric](19, 9) NULL,
	[document_id] [uniqueidentifier] NOT NULL,
	[volume] [int] NULL,
 CONSTRAINT [PK_EgaisShopWriteoffItem_fd9f0694] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisShopWriteoffLink]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisShopWriteoffLink](
	[id] [uniqueidentifier] NOT NULL,
	[internalDocumentDate] [datetime] NOT NULL,
	[internalDocumentId] [uniqueidentifier] NOT NULL,
	[internalDocumentNumber] [nvarchar](255) NOT NULL,
	[internalDocumentType] [char](32) NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EgaisShopWriteoffLink_d74c6883] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisTransactionPart]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisTransactionPart](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[amountChange] [numeric](19, 9) NOT NULL,
	[amountRemain] [numeric](19, 9) NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateIncoming] [datetime] NOT NULL,
	[documentId] [uniqueidentifier] NOT NULL,
	[documentItemId] [uniqueidentifier] NOT NULL,
	[documentItemNumber] [int] NOT NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[documentRegId] [nvarchar](64) NULL,
	[documentType] [nvarchar](30) NOT NULL,
	[key_aRegId] [nvarchar](64) NULL,
	[key_alcCode] [nvarchar](64) NULL,
	[key_bRegId] [nvarchar](64) NULL,
	[sourceRarId] [nvarchar](255) NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[producerRarId] [nvarchar](64) NOT NULL,
	[productCapacity] [numeric](19, 9) NOT NULL,
	[productIsPacked] [tinyint] NOT NULL,
	[productName] [nvarchar](255) NOT NULL,
	[quantityChange] [numeric](19, 9) NOT NULL,
	[quantityRemain] [numeric](19, 9) NOT NULL,
	[quantityTotalExpected] [numeric](19, 9) NULL,
 CONSTRAINT [PK_EgaisTransactionPart_bc1beb11] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisTransactionPart_sourceRarId_dateIncoming]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisTransactionPart_sourceRarId_dateIncoming] ON [dbo].[EgaisTransactionPart]
(
	[sourceRarId] ASC,
	[dateIncoming] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EgaisUnsealEvent]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EgaisUnsealEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[action] [nvarchar](10) NOT NULL,
	[barman] [uniqueidentifier] NULL,
	[dateFirstTry] [datetime] NULL,
	[deleted] [tinyint] NOT NULL,
	[documentId] [uniqueidentifier] NULL,
	[documentNumber] [nvarchar](255) NULL,
	[egaisAlcCode] [nvarchar](255) NULL,
	[egaisMarkCode] [nvarchar](255) NULL,
	[group] [uniqueidentifier] NULL,
	[modifiedInfo_date] [datetime] NULL,
	[modifiedInfo_user] [uniqueidentifier] NULL,
	[processingError] [nvarchar](255) NULL,
	[product] [uniqueidentifier] NULL,
	[productBarCode] [nvarchar](255) NULL,
	[restaurantSection] [uniqueidentifier] NULL,
	[sourceRarId] [nvarchar](255) NULL,
	[status] [nvarchar](10) NOT NULL,
	[unpackedAmount] [numeric](19, 9) NULL,
	[writeoffType] [nvarchar](40) NULL,
	[volume] [int] NULL,
 CONSTRAINT [PK_EgaisUnsealEvent_341ce54f] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [EgaisUnsealEvent_date]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EgaisUnsealEvent_date] ON [dbo].[EgaisUnsealEvent]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EmployeeAttendanceEntry]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EmployeeAttendanceEntry](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[created] [datetime] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[department] [uniqueidentifier] NOT NULL,
	[employee] [uniqueidentifier] NULL,
	[modified] [datetime] NULL,
	[lastEditor] [uniqueidentifier] NULL,
	[role] [uniqueidentifier] NULL,
	[salaryDepartment] [uniqueidentifier] NOT NULL,
	[attendanceType] [uniqueidentifier] NULL,
	[autoClosed] [tinyint] NOT NULL,
	[closeEvent_id] [uniqueidentifier] NULL,
	[comment] [nvarchar](2000) NULL,
	[confirmedManually] [tinyint] NOT NULL,
	[personalSessionEnd] [datetime] NULL,
	[personalSessionStart] [datetime] NULL,
 CONSTRAINT [PK_EmployeeAttendanceEntry_244fa78f] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAttendanceEntry_department_dateFrom]    Script Date: 04.08.2026 2:25:37 ******/
CREATE CLUSTERED INDEX [EmployeeAttendanceEntry_department_dateFrom] ON [dbo].[EmployeeAttendanceEntry]
(
	[department] ASC,
	[dateFrom] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EmployeeAvailabilityEntry]    Script Date: 04.08.2026 2:25:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EmployeeAvailabilityEntry](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[approvedInfo_date] [datetime] NULL,
	[approvedInfo_user] [uniqueidentifier] NULL,
	[available] [tinyint] NOT NULL,
	[createdInfo_date] [datetime] NULL,
	[createdInfo_user] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NOT NULL,
	[dateTo] [datetime] NOT NULL,
	[deletedInfo_date] [datetime] NULL,
	[deletedInfo_user] [uniqueidentifier] NULL,
	[employee] [uniqueidentifier] NOT NULL,
	[modifiedInfo_date] [datetime] NULL,
	[modifiedInfo_user] [uniqueidentifier] NULL,
	[priority] [numeric](19, 0) NOT NULL,
	[status] [int] NOT NULL,
 CONSTRAINT [PK_EmployeeAvailabilityEntry_e7ea0a49] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EmployeeAvailabilitySchedule]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EmployeeAvailabilitySchedule](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[employee] [uniqueidentifier] NOT NULL,
	[shiftScheduleInfo_days] [ntext] NULL,
	[shiftScheduleInfo_name] [nvarchar](255) NULL,
	[shiftScheduleInfo_value] [tinyint] NULL,
 CONSTRAINT [PK_EmployeeAvailabilitySchedule_cdcd4ec4] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAvailabilitySchedule_dateTo]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [EmployeeAvailabilitySchedule_dateTo] ON [dbo].[EmployeeAvailabilitySchedule]
(
	[dateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EmployeeScheduleItem]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EmployeeScheduleItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[created] [datetime] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[department] [uniqueidentifier] NOT NULL,
	[employee] [uniqueidentifier] NULL,
	[modified] [datetime] NULL,
	[lastEditor] [uniqueidentifier] NULL,
	[role] [uniqueidentifier] NULL,
	[salaryDepartment] [uniqueidentifier] NOT NULL,
	[earlyPenaltyCancel_comment] [nvarchar](2000) NULL,
	[latePenaltyCancel_comment] [nvarchar](2000) NULL,
	[missPenaltyCancel_comment] [nvarchar](2000) NULL,
	[nonPaidMinutes] [int] NOT NULL,
	[penaltyOverrideId] [uniqueidentifier] NULL,
	[scheduleType] [uniqueidentifier] NOT NULL,
	[state] [int] NULL,
 CONSTRAINT [PK_EmployeeScheduleItem_26f763bd] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeScheduleItem_department_dateFrom]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [EmployeeScheduleItem_department_dateFrom] ON [dbo].[EmployeeScheduleItem]
(
	[department] ASC,
	[dateFrom] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[entity]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[entity](
	[id] [uniqueidentifier] NOT NULL,
	[deleted] [tinyint] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[type] [nvarchar](64) NOT NULL,
	[xml] [ntext] NULL,
 CONSTRAINT [PK_entity_3bf74713] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [entity_type_id]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [entity_type_id] ON [dbo].[entity]
(
	[type] ASC,
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ForcedReplicationClass]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ForcedReplicationClass](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[className] [nvarchar](255) NOT NULL,
	[onlyNew] [tinyint] NULL,
	[onlyUpdate] [tinyint] NULL,
	[reason] [nvarchar](255) NULL,
 CONSTRAINT [PK_ForcedReplicationClass_cc1fc4db] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IikoNetExchangeEvent]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IikoNetExchangeEvent](
	[dtype] [nvarchar](5) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[lastExchangeDate] [datetime] NULL,
	[lastExportedRevision] [int] NOT NULL,
	[serverId] [uniqueidentifier] NULL,
	[lastImportedRevision] [bigint] NULL,
 CONSTRAINT [PK_IikoNetExchangeEvent_67e1d676] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingInventory]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingInventory](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[accountShortage] [uniqueidentifier] SPARSE  NULL,
	[accountSurplus] [uniqueidentifier] SPARSE  NULL,
	[currentStep] [int] NOT NULL,
	[editable] [tinyint] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[operationalDayId] [uniqueidentifier] SPARSE  NULL,
	[registerTurnover] [tinyint] NOT NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
	[store] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_IncomingInventory_78610cf1] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IncomingInventory_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IncomingInventory_dateIncoming_documentNumber] ON [dbo].[IncomingInventory]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingInventory_DisassembledProduct]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingInventory_DisassembledProduct](
	[inventory_id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NULL,
	[product_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_IncomingInventory_DisassembledProduct_d87bb62d] PRIMARY KEY NONCLUSTERED 
(
	[inventory_id] ASC,
	[product_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingInventoryItem]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingInventoryItem](
	[dtype] [nvarchar](8) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[comment] [nvarchar](2000) NULL,
	[containerCount] [numeric](19, 9) NULL,
	[containerId] [uniqueidentifier] NULL,
	[containerName] [nvarchar](2000) NULL,
	[count] [numeric](19, 9) NULL,
	[countGross] [numeric](19, 9) NULL,
	[currentActualAmount] [numeric](19, 9) NULL,
	[isDisassembled] [tinyint] NOT NULL,
	[producer] [uniqueidentifier] NULL,
	[productSize] [uniqueidentifier] NULL,
	[recalculationDate] [datetime] NULL,
	[recalculationNumber] [int] NULL,
	[status] [int] NULL,
	[turnover] [numeric](19, 9) NULL,
	[unit] [uniqueidentifier] NULL,
	[inventory_id] [uniqueidentifier] NULL,
 CONSTRAINT [PK_IncomingInventoryItem_8036223b] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingInvoice]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingInvoice](
	[dtype] [nvarchar](8) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[defaultStore] [uniqueidentifier] SPARSE  NULL,
	[dueDate] [datetime] SPARSE  NULL,
	[invoice] [nvarchar](255) SPARSE  NULL,
	[manualPaymentDate] [datetime] SPARSE  NULL,
	[supplier] [uniqueidentifier] SPARSE  NULL,
	[deliveryOnTime] [tinyint] SPARSE  NULL,
	[employeePassToAccount] [uniqueidentifier] SPARSE  NULL,
	[incomingDate] [datetime] SPARSE  NULL,
	[incomingDocumentNumber] [nvarchar](255) SPARSE  NULL,
	[matchesToTheOrder] [tinyint] SPARSE  NULL,
	[automatic] [tinyint] NOT NULL,
	[boughtAtFront] [tinyint] NOT NULL,
	[editable] [tinyint] NOT NULL,
	[internalOutgoingInvoiceId] [uniqueidentifier] SPARSE  NULL,
	[isAdditionalExpensesBySum] [tinyint] NOT NULL,
	[manualDueDate] [tinyint] NOT NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
	[transportInvoiceNumber] [nvarchar](255) SPARSE  NULL,
	[currency] [nvarchar](255) SPARSE  NULL,
	[deliveryInfo_estimatedDeliveryDate] [datetime] SPARSE  NULL,
	[deliveryInfo_shipFrom] [nvarchar](255) SPARSE  NULL,
	[deliveryInfo_shipTo] [nvarchar](255) SPARSE  NULL,
	[deliveryInfo_shippingDate] [datetime] SPARSE  NULL,
	[deliveryInfo_transportInfo] [nvarchar](255) SPARSE  NULL,
	[ediId_date] [datetime] SPARSE  NULL,
	[ediId_number] [nvarchar](255) SPARSE  NULL,
	[ediSystem] [uniqueidentifier] SPARSE  NULL,
	[processingStatus] [int] SPARSE  NULL,
	[ediOrder] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_IncomingInvoice_fd011b85] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IncomingInvoice_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IncomingInvoice_dateIncoming_documentNumber] ON [dbo].[IncomingInvoice]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingInvoiceItem]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[actualUnitWeight] [numeric](19, 9) NULL,
	[code] [nvarchar](64) NULL,
	[comment] [nvarchar](255) NULL,
	[customsDeclarationNumber] [nvarchar](255) NULL,
	[discountSum] [numeric](19, 9) NULL,
	[expireDate] [datetime] NULL,
	[ndsPercent] [numeric](19, 9) NULL,
	[price] [numeric](19, 9) NULL,
	[priceUnit] [uniqueidentifier] NULL,
	[priceWithoutNds] [numeric](19, 9) NOT NULL,
	[store] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NULL,
	[sumWithoutNds] [numeric](19, 9) NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[additionalExpenses] [numeric](19, 9) NULL,
	[additionalExpensesNds] [numeric](19, 9) NULL,
	[isAdditionalExpense] [tinyint] NOT NULL,
	[orderNum] [int] NULL,
	[producer] [uniqueidentifier] NULL,
	[supCode] [nvarchar](255) NULL,
	[supProductName] [nvarchar](255) NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_IncomingInvoiceItem_384fb58c] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IncomingInvoiceItem_invoice]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IncomingInvoiceItem_invoice] ON [dbo].[IncomingInvoiceItem]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingReturnedInvoice]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingReturnedInvoice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[defaultStore] [uniqueidentifier] SPARSE  NULL,
	[dueDate] [datetime] SPARSE  NULL,
	[invoice] [nvarchar](255) SPARSE  NULL,
	[manualPaymentDate] [datetime] SPARSE  NULL,
	[supplier] [uniqueidentifier] SPARSE  NULL,
	[accountTo] [uniqueidentifier] SPARSE  NULL,
	[discountsAccount] [uniqueidentifier] SPARSE  NULL,
	[revenueAccount] [uniqueidentifier] SPARSE  NULL,
	[revenueDebitAccount] [uniqueidentifier] SPARSE  NULL,
	[editable] [tinyint] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[outgoingInvoiceId] [uniqueidentifier] SPARSE  NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
	[processingMode] [nvarchar](40) NOT NULL,
 CONSTRAINT [PK_IncomingReturnedInvoice_425498e3] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IncomingReturnedInvoice_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IncomingReturnedInvoice_dateIncoming_documentNumber] ON [dbo].[IncomingReturnedInvoice]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingReturnedInvoiceItem]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingReturnedInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[actualUnitWeight] [numeric](19, 9) NULL,
	[code] [nvarchar](64) NULL,
	[comment] [nvarchar](255) NULL,
	[customsDeclarationNumber] [nvarchar](255) NULL,
	[discountSum] [numeric](19, 9) NULL,
	[expireDate] [datetime] NULL,
	[ndsPercent] [numeric](19, 9) NULL,
	[price] [numeric](19, 9) NULL,
	[priceUnit] [uniqueidentifier] NULL,
	[priceWithoutNds] [numeric](19, 9) NOT NULL,
	[store] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NULL,
	[sumWithoutNds] [numeric](19, 9) NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[incomePrice] [numeric](19, 9) NOT NULL,
	[incomeSum] [numeric](19, 9) NOT NULL,
	[producer] [uniqueidentifier] NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
	[productSize] [uniqueidentifier] NULL,
	[amountFactor] [numeric](19, 9) NOT NULL,
	[splitVat] [tinyint] NOT NULL,
 CONSTRAINT [PK_IncomingReturnedInvoiceItem_803d949e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IncomingReturnedInvoiceItem_invoice]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IncomingReturnedInvoiceItem_invoice] ON [dbo].[IncomingReturnedInvoiceItem]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingService]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingService](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[defaultStore] [uniqueidentifier] SPARSE  NULL,
	[dueDate] [datetime] SPARSE  NULL,
	[invoice] [nvarchar](255) SPARSE  NULL,
	[manualPaymentDate] [datetime] SPARSE  NULL,
	[supplier] [uniqueidentifier] SPARSE  NULL,
	[deliveryOnTime] [tinyint] SPARSE  NULL,
	[employeePassToAccount] [uniqueidentifier] SPARSE  NULL,
	[incomingDate] [datetime] SPARSE  NULL,
	[incomingDocumentNumber] [nvarchar](255) SPARSE  NULL,
	[matchesToTheOrder] [tinyint] SPARSE  NULL,
	[contractDate] [datetime] SPARSE  NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[docNumber] [nvarchar](255) SPARSE  NULL,
	[revenueAccount] [uniqueidentifier] SPARSE  NULL,
	[editable] [tinyint] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[revenueCreditAccount] [uniqueidentifier] NOT NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_IncomingService_78eaab1] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IncomingService_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IncomingService_dateIncoming_documentNumber] ON [dbo].[IncomingService]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IncomingServiceItem]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IncomingServiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[actualUnitWeight] [numeric](19, 9) NULL,
	[code] [nvarchar](64) NULL,
	[comment] [nvarchar](255) NULL,
	[customsDeclarationNumber] [nvarchar](255) NULL,
	[discountSum] [numeric](19, 9) NULL,
	[expireDate] [datetime] NULL,
	[ndsPercent] [numeric](19, 9) NULL,
	[price] [numeric](19, 9) NULL,
	[priceUnit] [uniqueidentifier] NULL,
	[priceWithoutNds] [numeric](19, 9) NOT NULL,
	[store] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NULL,
	[sumWithoutNds] [numeric](19, 9) NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[account] [uniqueidentifier] NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
	[splitVat] [tinyint] NOT NULL,
 CONSTRAINT [PK_IncomingServiceItem_59dc0abf] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IncomingServiceItem_invoice]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IncomingServiceItem_invoice] ON [dbo].[IncomingServiceItem]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IndependentPriceList]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IndependentPriceList](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[key_empty] [uniqueidentifier] NULL,
 CONSTRAINT [PK_IndependentPriceList_489877fd] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IndependentPriceList_dateTo]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IndependentPriceList_dateTo] ON [dbo].[IndependentPriceList]
(
	[dateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[IndependentPriceListItem]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[IndependentPriceListItem](
	[id] [uniqueidentifier] NOT NULL,
	[allowablePriceDeviation] [numeric](19, 9) NULL,
	[containerId] [uniqueidentifier] NOT NULL,
	[costPrice] [numeric](19, 9) NOT NULL,
	[deleted] [tinyint] NOT NULL,
	[nativeProduct] [uniqueidentifier] NOT NULL,
	[priceList] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_IndependentPriceListItem_5f1c259d] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IndependentPriceListItem_priceList]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [IndependentPriceListItem_priceList] ON [dbo].[IndependentPriceListItem]
(
	[priceList] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InternalTransfer]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InternalTransfer](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[storeFrom] [uniqueidentifier] SPARSE  NULL,
	[storeTo] [uniqueidentifier] SPARSE  NULL,
	[editable] [tinyint] SPARSE  NULL,
	[idPreparedRegisterDocument] [uniqueidentifier] SPARSE  NULL,
	[idProductionOrder] [uniqueidentifier] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[operationalDayId] [uniqueidentifier] SPARSE  NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_InternalTransfer_e68c19dd] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [InternalTransfer_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [InternalTransfer_dateIncoming_documentNumber] ON [dbo].[InternalTransfer]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InternalTransferItem]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InternalTransferItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[transfer_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_InternalTransferItem_203ee6fd] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ItemCookingEvent]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ItemCookingEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[amount] [numeric](19, 9) NULL,
	[dish] [uniqueidentifier] NULL,
	[feedEstimatedTime] [datetime] SPARSE  NULL,
	[feedTime] [datetime] SPARSE  NULL,
	[orderId] [uniqueidentifier] NULL,
	[readyEstimatedTime] [datetime] SPARSE  NULL,
	[readyTime] [datetime] SPARSE  NULL,
	[saleItemId] [uniqueidentifier] NULL,
	[serveNumber] [int] NOT NULL,
	[startCooking1Time] [datetime] SPARSE  NULL,
	[startCooking2Time] [datetime] SPARSE  NULL,
	[startCooking3Time] [datetime] SPARSE  NULL,
	[startCooking4Time] [datetime] SPARSE  NULL,
	[publicExternalData] [ntext] NOT NULL,
 CONSTRAINT [PK_ItemCookingEvent_d7e89681] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ItemSaleEvent]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ItemSaleEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[boughtFromCashdesk] [tinyint] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[cookingPlace] [uniqueidentifier] SPARSE  NULL,
	[cookingPlaceType] [uniqueidentifier] SPARSE  NULL,
	[deletedWithWriteoff] [int] SPARSE  NULL,
	[deletionComment] [nvarchar](255) SPARSE  NULL,
	[deletionMethodId] [nvarchar](255) SPARSE  NULL,
	[deliverTime] [datetime] SPARSE  NULL,
	[discount] [numeric](19, 9) NULL,
	[discountSum] [numeric](19, 9) NULL,
	[discountSums] [ntext] NULL,
	[dishAmount] [numeric](19, 9) NULL,
	[dishDiscountSum] [numeric](19, 9) NULL,
	[dishInfo] [uniqueidentifier] NOT NULL,
	[dishPlanAmount] [numeric](19, 9) NULL,
	[dishPrice] [numeric](19, 9) NULL,
	[dishSize] [uniqueidentifier] SPARSE  NULL,
	[dishSum] [numeric](19, 9) NULL,
	[incomeSupplier] [uniqueidentifier] SPARSE  NULL,
	[increase] [numeric](19, 9) NULL,
	[increaseSum] [numeric](19, 9) NULL,
	[nds] [numeric](19, 9) NULL,
	[ndsEnabled] [tinyint] SPARSE  NULL,
	[ndsSum] [numeric](19, 9) NULL,
	[ndsSumFiscal] [numeric](19, 9) NULL,
	[openTime] [datetime] SPARSE  NULL,
	[orderBanquet] [tinyint] SPARSE  NULL,
	[orderId] [uniqueidentifier] NOT NULL,
	[orderNum] [int] NOT NULL,
	[paymentSystemAccount] [uniqueidentifier] SPARSE  NULL,
	[paymentTransactionId] [uniqueidentifier] SPARSE  NULL,
	[prechequeGuestNum] [int] NOT NULL,
	[printTime] [datetime] SPARSE  NULL,
	[processed] [tinyint] SPARSE  NULL,
	[removalType] [uniqueidentifier] SPARSE  NULL,
	[removalTypeId] [int] SPARSE  NULL,
	[restaurantSection] [uniqueidentifier] SPARSE  NULL,
	[session_group] [uniqueidentifier] SPARSE  NULL,
	[session_id] [uniqueidentifier] SPARSE  NULL,
	[session_number] [int] SPARSE  NULL,
	[soldWithDish] [uniqueidentifier] SPARSE  NULL,
	[soldWithItem] [uniqueidentifier] SPARSE  NULL,
	[store] [uniqueidentifier] SPARSE  NULL,
	[storeTo] [uniqueidentifier] SPARSE  NULL,
	[tableNum] [nvarchar](255) SPARSE  NULL,
	[taxCategory] [uniqueidentifier] SPARSE  NULL,
	[waiter] [uniqueidentifier] SPARSE  NULL,
	[writeoffPaymentType] [uniqueidentifier] SPARSE  NULL,
	[splitVat] [tinyint] NOT NULL,
	[versionCompatibility] [nvarchar](10) NOT NULL,
	[payableAmount] [numeric](19, 9) NOT NULL,
	[sourceEventId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_ItemSaleEvent_95290126] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEvent_date_orderId]    Script Date: 04.08.2026 2:25:38 ******/
CREATE CLUSTERED INDEX [ItemSaleEvent_date_orderId] ON [dbo].[ItemSaleEvent]
(
	[date] ASC,
	[orderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ItemSaleEventDiscount]    Script Date: 04.08.2026 2:25:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ItemSaleEventDiscount](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[discountEventId] [uniqueidentifier] NOT NULL,
	[discountSum] [numeric](19, 9) NOT NULL,
	[discountType] [uniqueidentifier] NOT NULL,
	[dishAmount] [numeric](19, 9) NOT NULL,
	[increaseSum] [numeric](19, 9) NOT NULL,
	[isDiscount] [tinyint] NOT NULL,
	[itemSaleEventDate] [datetime] NOT NULL,
	[itemSaleEventId] [uniqueidentifier] NOT NULL,
	[comboName] [nvarchar](255) NULL,
	[comboId] [uniqueidentifier] NULL,
	[comboSize] [uniqueidentifier] NULL,
	[comboAmount] [int] NOT NULL,
	[comboGroupName] [nvarchar](255) NULL,
	[comboGroupId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_ItemSaleEventDiscount_6aebfb8] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEventDiscount_itemSaleEventDate]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [ItemSaleEventDiscount_itemSaleEventDate] ON [dbo].[ItemSaleEventDiscount]
(
	[itemSaleEventDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MappingElement]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MappingElement](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[conception] [uniqueidentifier] NULL,
	[elementType] [nvarchar](255) NOT NULL,
	[externalElementId] [nvarchar](255) NOT NULL,
	[nativeElementId] [uniqueidentifier] NOT NULL,
	[transferType] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_MappingElement_8162f057] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notice]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[dateCreated] [datetime] NOT NULL,
	[dateReceived] [datetime] NOT NULL,
	[deleted] [tinyint] NOT NULL,
	[importance] [int] NOT NULL,
	[message] [nvarchar](4000) NOT NULL,
	[modifiedInfo_date] [datetime] NULL,
	[modifiedInfo_user] [uniqueidentifier] NULL,
	[type] [char](20) NOT NULL,
	[unread] [tinyint] NOT NULL,
 CONSTRAINT [PK_Notice_5a45c4d9] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [Notice_dateReceived]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [Notice_dateReceived] ON [dbo].[Notice]
(
	[dateReceived] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OrderBonusEvent]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OrderBonusEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[bonus] [numeric](19, 9) NULL,
	[cancelled] [tinyint] NOT NULL,
	[cardNumber] [nvarchar](255) NULL,
	[type] [nvarchar](255) NULL,
	[order_id] [uniqueidentifier] NULL,
 CONSTRAINT [PK_OrderBonusEvent_6b4e6733] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [OrderBonusEvent_date]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [OrderBonusEvent_date] ON [dbo].[OrderBonusEvent]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OrderCustomer]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OrderCustomer](
	[customerId] [uniqueidentifier] NOT NULL,
	[orderId] [uniqueidentifier] NOT NULL,
	[date] [datetime] NOT NULL,
	[orderPaymentEventId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_OrderCustomer_58a9ce1c] PRIMARY KEY NONCLUSTERED 
(
	[orderId] ASC,
	[customerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [OrderCustomer_date]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [OrderCustomer_date] ON [dbo].[OrderCustomer]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OrderPaymentEvent]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OrderPaymentEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[auth_card_slip] [nvarchar](64) SPARSE  NULL,
	[auth_user] [uniqueidentifier] SPARSE  NULL,
	[cashRegister] [uniqueidentifier] SPARSE  NULL,
	[cashier] [uniqueidentifier] SPARSE  NULL,
	[changeSum] [numeric](19, 9) NULL,
	[closeTime] [datetime] SPARSE  NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[counteragent] [uniqueidentifier] SPARSE  NULL,
	[detailedCheque] [tinyint] SPARSE  NULL,
	[discount] [ntext] NULL,
	[divisions] [int] NOT NULL,
	[externalNumber] [nvarchar](255) SPARSE  NULL,
	[increase] [ntext] NULL,
	[isBanquet] [tinyint] NOT NULL,
	[isDelivery] [tinyint] NOT NULL,
	[nonCashPaymentType] [uniqueidentifier] SPARSE  NULL,
	[numGuests] [int] NOT NULL,
	[openTime] [datetime] SPARSE  NULL,
	[orderDeleted] [tinyint] SPARSE  NULL,
	[order] [uniqueidentifier] NOT NULL,
	[orderNum] [int] NOT NULL,
	[orderSum] [numeric](19, 9) NULL,
	[orderSumAfterDiscount] [numeric](19, 9) NULL,
	[orderType] [uniqueidentifier] SPARSE  NULL,
	[originName] [nvarchar](255) SPARSE  NULL,
	[prechequeTime] [datetime] SPARSE  NULL,
	[priceCategory] [uniqueidentifier] SPARSE  NULL,
	[pcCard] [nvarchar](255) SPARSE  NULL,
	[pcDiscountCard] [uniqueidentifier] SPARSE  NULL,
	[pcUser] [uniqueidentifier] SPARSE  NULL,
	[problemOpName] [nvarchar](255) SPARSE  NULL,
	[problemPriority] [int] NOT NULL,
	[problemType] [char](30) SPARSE  NULL,
	[publicExternalData] [ntext] NOT NULL,
	[receiptsSum] [numeric](19, 9) NULL,
	[restaurantSection] [uniqueidentifier] SPARSE  NULL,
	[session_group] [uniqueidentifier] SPARSE  NULL,
	[session_id] [uniqueidentifier] SPARSE  NULL,
	[session_number] [int] SPARSE  NULL,
	[storned] [tinyint] SPARSE  NULL,
	[sumCard] [numeric](19, 9) NULL,
	[sumCash] [numeric](19, 9) NULL,
	[sumCredit] [numeric](19, 9) NULL,
	[sumPlanned] [numeric](19, 9) NULL,
	[sumPrepay] [numeric](19, 9) NULL,
	[tableNum] [nvarchar](255) SPARSE  NULL,
	[unmodifiable] [tinyint] SPARSE  NULL,
	[user] [uniqueidentifier] SPARSE  NULL,
	[vatInvoiceId] [uniqueidentifier] SPARSE  NULL,
	[waiter] [uniqueidentifier] SPARSE  NULL,
	[waiterTeam] [uniqueidentifier] SPARSE  NULL,
	[writeoffPaymentType] [uniqueidentifier] SPARSE  NULL,
	[writeoffRatio] [int] SPARSE  NULL,
	[writeoffReason] [nvarchar](2000) SPARSE  NULL,
	[writeoffUser] [uniqueidentifier] SPARSE  NULL,
	[fiscalChequeNumbers] [ntext] NOT NULL,
	[couponInfoNumber] [nvarchar](255) NULL,
	[couponInfoSeries] [nvarchar](255) NULL,
	[groupOrderId] [uniqueidentifier] NULL,
	[groupOrderNum] [int] NULL,
	[sourceOrderId] [uniqueidentifier] NULL,
	[sourceOrderNum] [int] NULL,
	[versionCompatibility] [nvarchar](10) NOT NULL,
 CONSTRAINT [PK_OrderPaymentEvent_2357ad0e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_date_order]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [OrderPaymentEvent_date_order] ON [dbo].[OrderPaymentEvent]
(
	[date] ASC,
	[order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OutgoingInvoice]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OutgoingInvoice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[defaultStore] [uniqueidentifier] SPARSE  NULL,
	[dueDate] [datetime] SPARSE  NULL,
	[invoice] [nvarchar](255) SPARSE  NULL,
	[manualPaymentDate] [datetime] SPARSE  NULL,
	[supplier] [uniqueidentifier] SPARSE  NULL,
	[accountTo] [uniqueidentifier] SPARSE  NULL,
	[discountsAccount] [uniqueidentifier] SPARSE  NULL,
	[revenueAccount] [uniqueidentifier] SPARSE  NULL,
	[revenueDebitAccount] [uniqueidentifier] SPARSE  NULL,
	[editable] [tinyint] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[isCorrected] [tinyint] SPARSE  NULL,
	[operationalDayId] [uniqueidentifier] SPARSE  NULL,
	[pricingParameters] [ntext] NULL,
	[recalculateSumByCost] [tinyint] NOT NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
	[deliveryOrderId] [uniqueidentifier] SPARSE  NULL,
	[internalIncomingInvoiceId] [uniqueidentifier] SPARSE  NULL,
	[manualDueDate] [tinyint] NOT NULL,
 CONSTRAINT [PK_OutgoingInvoice_fdb787ea] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [OutgoingInvoice_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [OutgoingInvoice_dateIncoming_documentNumber] ON [dbo].[OutgoingInvoice]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OutgoingInvoiceItem]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OutgoingInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[actualUnitWeight] [numeric](19, 9) NULL,
	[code] [nvarchar](64) NULL,
	[comment] [nvarchar](255) NULL,
	[customsDeclarationNumber] [nvarchar](255) NULL,
	[discountSum] [numeric](19, 9) NULL,
	[expireDate] [datetime] NULL,
	[ndsPercent] [numeric](19, 9) NULL,
	[price] [numeric](19, 9) NULL,
	[priceUnit] [uniqueidentifier] NULL,
	[priceWithoutNds] [numeric](19, 9) NOT NULL,
	[store] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NULL,
	[sumWithoutNds] [numeric](19, 9) NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[amountFactor] [numeric](19, 9) NOT NULL,
	[correctedAssemblyChartItems] [ntext] NULL,
	[productSize] [uniqueidentifier] NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_OutgoingInvoiceItem_8dd07873] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [OutgoingInvoiceItem_invoice]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [OutgoingInvoiceItem_invoice] ON [dbo].[OutgoingInvoiceItem]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OutgoingService]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OutgoingService](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[defaultStore] [uniqueidentifier] SPARSE  NULL,
	[dueDate] [datetime] SPARSE  NULL,
	[invoice] [nvarchar](255) SPARSE  NULL,
	[manualPaymentDate] [datetime] SPARSE  NULL,
	[supplier] [uniqueidentifier] SPARSE  NULL,
	[deliveryOnTime] [tinyint] SPARSE  NULL,
	[employeePassToAccount] [uniqueidentifier] SPARSE  NULL,
	[incomingDate] [datetime] SPARSE  NULL,
	[incomingDocumentNumber] [nvarchar](255) SPARSE  NULL,
	[matchesToTheOrder] [tinyint] SPARSE  NULL,
	[contractDate] [datetime] SPARSE  NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[docNumber] [nvarchar](255) SPARSE  NULL,
	[revenueAccount] [uniqueidentifier] SPARSE  NULL,
	[editable] [tinyint] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[orderId] [uniqueidentifier] SPARSE  NULL,
	[registerNumber] [nvarchar](255) SPARSE  NULL,
	[revenueDebitAccount] [uniqueidentifier] SPARSE  NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_OutgoingService_b1152eb7] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [OutgoingService_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [OutgoingService_dateIncoming_documentNumber] ON [dbo].[OutgoingService]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OutgoingServiceItem]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OutgoingServiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[actualUnitWeight] [numeric](19, 9) NULL,
	[code] [nvarchar](64) NULL,
	[comment] [nvarchar](255) NULL,
	[customsDeclarationNumber] [nvarchar](255) NULL,
	[discountSum] [numeric](19, 9) NULL,
	[expireDate] [datetime] NULL,
	[ndsPercent] [numeric](19, 9) NULL,
	[price] [numeric](19, 9) NULL,
	[priceUnit] [uniqueidentifier] NULL,
	[priceWithoutNds] [numeric](19, 9) NOT NULL,
	[store] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NULL,
	[sumWithoutNds] [numeric](19, 9) NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[account] [uniqueidentifier] NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
	[splitVat] [tinyint] NOT NULL,
 CONSTRAINT [PK_OutgoingServiceItem_3b08cd68] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [OutgoingServiceItem_invoice]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [OutgoingServiceItem_invoice] ON [dbo].[OutgoingServiceItem]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PaymentStrategy]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PaymentStrategy](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[employee] [uniqueidentifier] NULL,
	[paymentPerHour] [numeric](19, 9) NULL,
	[salaryDepartment] [uniqueidentifier] NULL,
	[scheduleType] [nvarchar](255) NULL,
	[specification] [ntext] NOT NULL,
	[steadySalary] [numeric](19, 9) NOT NULL,
 CONSTRAINT [PK_PaymentStrategy_1c1b0055] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [PaymentStrategy_dateTo]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [PaymentStrategy_dateTo] ON [dbo].[PaymentStrategy]
(
	[dateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Payroll]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Payroll](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[dateFrom] [datetime] NOT NULL,
	[dateTo] [datetime] NOT NULL,
	[department] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_Payroll_4ddcc639] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [Payroll_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [Payroll_dateIncoming_documentNumber] ON [dbo].[Payroll]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PreparedAssemblyChart]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PreparedAssemblyChart](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[directWriteoffStoreSpecification] [ntext] NULL,
	[product] [uniqueidentifier] NOT NULL,
	[productSizeAssemblyStrategy] [int] NOT NULL,
	[writeoffStrategy] [int] NULL,
 CONSTRAINT [PK_PreparedAssemblyChart_fad305ec] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [PreparedAssemblyChart_product_dateFrom]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [PreparedAssemblyChart_product_dateFrom] ON [dbo].[PreparedAssemblyChart]
(
	[product] ASC,
	[dateFrom] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PreparedAssemblyChartItem]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PreparedAssemblyChartItem](
	[id] [uniqueidentifier] NOT NULL,
	[sortWeight] [float] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[productSizeSpecification] [uniqueidentifier] NULL,
	[storeSpecificationEntity] [uniqueidentifier] NULL,
	[assemblyChart_id] [uniqueidentifier] NULL,
 CONSTRAINT [PK_PreparedAssemblyChartItem_973fbec7] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [PreparedAssemblyChartItem_assemblyChart]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [PreparedAssemblyChartItem_assemblyChart] ON [dbo].[PreparedAssemblyChartItem]
(
	[assemblyChart_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PreparedRegisterDocument]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PreparedRegisterDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[departmentTo] [uniqueidentifier] SPARSE  NULL,
	[ingredientsStoreFrom] [uniqueidentifier] SPARSE  NULL,
	[ingredientsStoreTo] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_PreparedRegisterDocument_436281f9] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [PreparedRegisterDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [PreparedRegisterDocument_dateIncoming_documentNumber] ON [dbo].[PreparedRegisterDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PreparedRegisterItem]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PreparedRegisterItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NULL,
	[amountOriginal] [numeric](19, 9) NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[product] [uniqueidentifier] NULL,
	[session] [nvarchar](255) NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_PreparedRegisterItem_6c6e6db6] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PriceListItem]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PriceListItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[documentId] [uniqueidentifier] NOT NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateToLimit] [datetime] NOT NULL,
	[department] [uniqueidentifier] NOT NULL,
	[includeForCategories] [ntext] NOT NULL,
	[included] [tinyint] NOT NULL,
	[isDishOfDay] [tinyint] NULL,
	[isFlyerProgram] [tinyint] NULL,
	[price] [numeric](19, 9) NULL,
	[pricesForCategories] [ntext] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[productSize] [uniqueidentifier] NULL,
	[scheduledDocument] [uniqueidentifier] NULL,
	[taxCategory_value] [uniqueidentifier] NULL,
	[taxCategory_enabled] [tinyint] NOT NULL,
 CONSTRAINT [PK_PriceListItem_b68ffffb] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [PriceListItem_dateTo_department]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [PriceListItem_dateTo_department] ON [dbo].[PriceListItem]
(
	[dateTo] ASC,
	[department] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PriceTableAllIncomeItem]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PriceTableAllIncomeItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[product] [uniqueidentifier] NOT NULL,
	[store] [uniqueidentifier] NOT NULL,
	[value_amount] [numeric](19, 9) NULL,
	[value_sum] [numeric](19, 9) NULL,
 CONSTRAINT [PK_PriceTableAllIncomeItem_84c2dbf6] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableAllIncomeItem_dateFrom_store_product]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [PriceTableAllIncomeItem_dateFrom_store_product] ON [dbo].[PriceTableAllIncomeItem]
(
	[dateFrom] ASC,
	[store] ASC,
	[product] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PriceTableInvoiceIncomeItem]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PriceTableInvoiceIncomeItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[product] [uniqueidentifier] NOT NULL,
	[store] [uniqueidentifier] NOT NULL,
	[value_amount] [numeric](19, 9) NULL,
	[value_sum] [numeric](19, 9) NULL,
 CONSTRAINT [PK_PriceTableInvoiceIncomeItem_c1b89fbc] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableInvoiceIncomeItem_dateFrom_store_product]    Script Date: 04.08.2026 2:25:39 ******/
CREATE CLUSTERED INDEX [PriceTableInvoiceIncomeItem_dateFrom_store_product] ON [dbo].[PriceTableInvoiceIncomeItem]
(
	[dateFrom] ASC,
	[store] ASC,
	[product] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PriceTableItem]    Script Date: 04.08.2026 2:25:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PriceTableItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[product] [uniqueidentifier] NOT NULL,
	[store] [uniqueidentifier] NOT NULL,
	[value_amount] [numeric](19, 9) NULL,
	[value_sum] [numeric](19, 9) NULL,
 CONSTRAINT [PK_PriceTableItem_127c326b] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableItem_dateFrom_store_product]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [PriceTableItem_dateFrom_store_product] ON [dbo].[PriceTableItem]
(
	[dateFrom] ASC,
	[store] ASC,
	[product] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductInventoryEvent]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductInventoryEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[accountShortage] [uniqueidentifier] NULL,
	[accountSurplus] [uniqueidentifier] NULL,
	[amountRequired] [numeric](19, 9) NULL,
	[conception] [uniqueidentifier] NULL,
	[inventory_id] [uniqueidentifier] NULL,
	[inventoryItemId] [uniqueidentifier] NULL,
	[inventoryNumber] [nvarchar](255) NULL,
	[product] [uniqueidentifier] NULL,
	[sessionId] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
 CONSTRAINT [PK_ProductInventoryEvent_d18cc5e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [ProductInventoryEvent_store_date]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ProductInventoryEvent_store_date] ON [dbo].[ProductInventoryEvent]
(
	[store] ASC,
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductionDocument]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductionDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[accountTo] [uniqueidentifier] NOT NULL,
	[counteragentTo] [uniqueidentifier] SPARSE  NULL,
	[editable] [tinyint] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[isCorrected] [tinyint] SPARSE  NULL,
	[operationalDayId] [uniqueidentifier] SPARSE  NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
	[store] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ProductionDocument_d1bf6d9] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ProductionDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ProductionDocument_dateIncoming_documentNumber] ON [dbo].[ProductionDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductionDocumentItem]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductionDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[amountFactor] [numeric](19, 9) NOT NULL,
	[correctedAssemblyChartItems] [ntext] NULL,
	[productSize] [uniqueidentifier] NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ProductionDocumentItem_38630a9e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductionOrder_InternalTransfer]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductionOrder_InternalTransfer](
	[productionOrder_id] [uniqueidentifier] NOT NULL,
	[internalTransfer_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ProductionOrder_InternalTransfer_d9cae9bd] PRIMARY KEY NONCLUSTERED 
(
	[productionOrder_id] ASC,
	[internalTransfer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductionOrder_OutgoingInvoice]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductionOrder_OutgoingInvoice](
	[productionOrder_id] [uniqueidentifier] NOT NULL,
	[outgoingInvoice_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ProductionOrder_OutgoingInvoice_50a78e00] PRIMARY KEY NONCLUSTERED 
(
	[productionOrder_id] ASC,
	[outgoingInvoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductionOrderDocument]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductionOrderDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[dateChangedAmounts] [datetime] SPARSE  NULL,
	[departmentFrom] [uniqueidentifier] SPARSE  NULL,
	[departmentTo] [uniqueidentifier] SPARSE  NULL,
	[franchiseOriginalId] [uniqueidentifier] SPARSE  NULL,
	[orderBlankId] [uniqueidentifier] SPARSE  NULL,
	[orderEndTime_days] [int] SPARSE  NULL,
	[orderEndTime_time] [datetime] SPARSE  NULL,
	[orderLimitTime_days] [int] SPARSE  NULL,
	[orderLimitTime_time] [datetime] SPARSE  NULL,
	[storeFrom] [uniqueidentifier] SPARSE  NULL,
	[supplier] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_ProductionOrderDocument_6a08da79] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ProductionOrderDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ProductionOrderDocument_dateIncoming_documentNumber] ON [dbo].[ProductionOrderDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductionOrderItem]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductionOrderItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[amountOriginal] [numeric](19, 9) NULL,
	[comment] [nvarchar](255) NULL,
	[franchiseStoreId] [uniqueidentifier] NULL,
	[position] [int] NULL,
	[store] [uniqueidentifier] NULL,
	[tabName] [nvarchar](255) NULL,
	[tabNum] [int] NOT NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ProductionOrderItem_4c13267] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductReplacementDocument]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductReplacementDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[departments] [ntext] NOT NULL,
 CONSTRAINT [PK_ProductReplacementDocument_e1c6cec6] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ProductReplacementDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ProductReplacementDocument_dateIncoming_documentNumber] ON [dbo].[ProductReplacementDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductReplacementItem]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductReplacementItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[document_id] [uniqueidentifier] NULL,
 CONSTRAINT [PK_ProductReplacementItem_16e1af8b] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductStockEvent]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductStockEvent](
	[DTYPE] [nvarchar](31) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[dateCreated] [datetime] NULL,
	[product] [uniqueidentifier] NOT NULL,
	[restoGroup] [uniqueidentifier] NOT NULL,
	[accountTo] [uniqueidentifier] NULL,
	[storeFrom] [uniqueidentifier] NULL,
	[employee] [uniqueidentifier] NULL,
	[cookingDate] [datetime] NULL,
	[expirationDate] [datetime] NULL,
 CONSTRAINT [PK_ProductStockEvent_dfc94bd8] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [ProductStockEvent_date]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ProductStockEvent_date] ON [dbo].[ProductStockEvent]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductWriteoffEvent]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductWriteoffEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[accountTo] [uniqueidentifier] NULL,
	[amount] [numeric](19, 9) NULL,
	[amountFactor] [numeric](19, 9) NOT NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[cookingPlace] [uniqueidentifier] SPARSE  NULL,
	[counteragentTo] [uniqueidentifier] SPARSE  NULL,
	[documentItemId] [uniqueidentifier] NULL,
	[incomingOverrideProduct] [uniqueidentifier] SPARSE  NULL,
	[product] [uniqueidentifier] NULL,
	[productSize] [uniqueidentifier] SPARSE  NULL,
	[session_id] [uniqueidentifier] SPARSE  NULL,
	[storeFrom] [uniqueidentifier] NULL,
	[type] [char](20) SPARSE  NULL,
	[writeoffDocumentId] [uniqueidentifier] NULL,
	[writeoffDocumentNumber] [nvarchar](255) NULL,
 CONSTRAINT [PK_ProductWriteoffEvent_71016b76] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [ProductWriteoffEvent_storeFrom_date]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ProductWriteoffEvent_storeFrom_date] ON [dbo].[ProductWriteoffEvent]
(
	[storeFrom] ASC,
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[QueryRewriteRule]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[QueryRewriteRule](
	[id] [uniqueidentifier] NOT NULL,
	[comment] [ntext] NOT NULL,
	[deleted] [tinyint] NOT NULL,
	[pattern] [ntext] NOT NULL,
	[replacement] [ntext] NOT NULL,
 CONSTRAINT [PK_QueryRewriteRule_5c8f37f2] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ReplicationEvent]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ReplicationEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[config] [uniqueidentifier] NULL,
	[entitiesCount] [int] NULL,
	[error] [ntext] NULL,
	[exchangeTime] [int] NULL,
	[initiator] [uniqueidentifier] NULL,
	[revisionFrom] [int] NOT NULL,
	[revisionTo] [int] NOT NULL,
	[source] [uniqueidentifier] NULL,
	[success] [tinyint] NOT NULL,
	[target] [uniqueidentifier] NULL,
 CONSTRAINT [PK_ReplicationEvent_6f30a93f] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [ReplicationEvent_date]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ReplicationEvent_date] ON [dbo].[ReplicationEvent]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Reserve]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Reserve](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[activityType] [nvarchar](255) NULL,
	[anonymized] [tinyint] NOT NULL,
	[cancelCause] [int] NULL,
	[cardNumber] [nvarchar](255) NULL,
	[cardType] [uniqueidentifier] NULL,
	[comment] [nvarchar](2000) NULL,
	[created_date] [datetime] NULL,
	[created_user] [uniqueidentifier] NULL,
	[customerEmail] [nvarchar](255) NULL,
	[customerPhoneNumber] [nvarchar](255) NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[durationMinutes] [int] NOT NULL,
	[externalId] [uniqueidentifier] NULL,
	[group] [uniqueidentifier] NOT NULL,
	[guestComing] [datetime] NULL,
	[guestGoOut] [datetime] NULL,
	[guests] [int] NOT NULL,
	[isBanquet] [tinyint] NOT NULL,
	[modified_date] [datetime] NULL,
	[modified_user] [uniqueidentifier] NULL,
	[number] [int] NOT NULL,
	[orderId] [uniqueidentifier] NULL,
	[orderNumber] [nvarchar](255) NULL,
	[payedSum] [numeric](19, 9) NULL,
	[reservedTables] [ntext] NOT NULL,
	[shouldRemind] [tinyint] NOT NULL,
	[status] [int] NULL,
	[syncRevision] [int] NOT NULL,
	[customerId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_Reserve_1f70603c] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [Reserve_date]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [Reserve_date] ON [dbo].[Reserve]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RestoTemp]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RestoTemp](
	[valueId] [uniqueidentifier] NOT NULL,
	[requestId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_RestoTemp_6ecd1f4e] PRIMARY KEY CLUSTERED 
(
	[requestId] ASC,
	[valueId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ReturnedInvoice]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ReturnedInvoice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[defaultStore] [uniqueidentifier] SPARSE  NULL,
	[dueDate] [datetime] SPARSE  NULL,
	[invoice] [nvarchar](255) SPARSE  NULL,
	[manualPaymentDate] [datetime] SPARSE  NULL,
	[supplier] [uniqueidentifier] SPARSE  NULL,
	[accountTo] [uniqueidentifier] SPARSE  NULL,
	[discountsAccount] [uniqueidentifier] SPARSE  NULL,
	[revenueAccount] [uniqueidentifier] SPARSE  NULL,
	[revenueDebitAccount] [uniqueidentifier] SPARSE  NULL,
	[incomingInvoiceId] [uniqueidentifier] SPARSE  NULL,
	[storeCostAffected] [tinyint] NOT NULL,
 CONSTRAINT [PK_ReturnedInvoice_54cb9688] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ReturnedInvoice_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ReturnedInvoice_dateIncoming_documentNumber] ON [dbo].[ReturnedInvoice]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ReturnedInvoiceItem]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ReturnedInvoiceItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[actualUnitWeight] [numeric](19, 9) NULL,
	[code] [nvarchar](64) NULL,
	[comment] [nvarchar](255) NULL,
	[customsDeclarationNumber] [nvarchar](255) NULL,
	[discountSum] [numeric](19, 9) NULL,
	[expireDate] [datetime] NULL,
	[ndsPercent] [numeric](19, 9) NULL,
	[price] [numeric](19, 9) NULL,
	[priceUnit] [uniqueidentifier] NULL,
	[priceWithoutNds] [numeric](19, 9) NOT NULL,
	[store] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NULL,
	[sumWithoutNds] [numeric](19, 9) NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[incomePrice] [numeric](19, 9) NULL,
	[producer] [uniqueidentifier] NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ReturnedInvoiceItem_9784a75d] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [ReturnedInvoiceItem_invoice]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [ReturnedInvoiceItem_invoice] ON [dbo].[ReturnedInvoiceItem]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RoleRequirementItem]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RoleRequirementItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[dateToLimit] [datetime] NOT NULL,
	[department] [uniqueidentifier] NOT NULL,
	[employeesRequired] [int] NOT NULL,
	[role] [uniqueidentifier] NOT NULL,
	[scheduleType] [uniqueidentifier] NULL,
 CONSTRAINT [PK_RoleRequirementItem_43da24f1] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SaleItem]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SaleItem](
	[dtype] [nvarchar](3) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[comment] [nvarchar](255) NULL,
	[dishAmount] [numeric](19, 9) NULL,
	[dishDiscountSum] [numeric](19, 9) NULL,
	[dishInfo] [uniqueidentifier] NULL,
	[dishPrice] [numeric](19, 9) NULL,
	[dishSum] [numeric](19, 9) NULL,
	[orderId] [uniqueidentifier] NULL,
	[orderNum] [int] NOT NULL,
	[parentId] [uniqueidentifier] NULL,
	[store] [uniqueidentifier] NULL,
	[deliveryId] [uniqueidentifier] NULL,
	[reserveId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_SaleItem_653f39be] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SalesDocument]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SalesDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[defaultStore] [uniqueidentifier] SPARSE  NULL,
	[dueDate] [datetime] SPARSE  NULL,
	[invoice] [nvarchar](255) SPARSE  NULL,
	[manualPaymentDate] [datetime] SPARSE  NULL,
	[supplier] [uniqueidentifier] SPARSE  NULL,
	[accountTo] [uniqueidentifier] SPARSE  NULL,
	[discountsAccount] [uniqueidentifier] SPARSE  NULL,
	[revenueAccount] [uniqueidentifier] SPARSE  NULL,
	[revenueDebitAccount] [uniqueidentifier] SPARSE  NULL,
	[editable] [tinyint] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[isCorrected] [tinyint] SPARSE  NULL,
	[operationalDayId] [uniqueidentifier] SPARSE  NULL,
	[pricingParameters] [ntext] NULL,
	[recalculateSumByCost] [tinyint] NOT NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
	[banquet] [tinyint] SPARSE  NULL,
	[externalOutgoingInvoiceId] [uniqueidentifier] SPARSE  NULL,
	[externalProductionDocumentId] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_SalesDocument_fc77a3d3] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [SalesDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:40 ******/
CREATE CLUSTERED INDEX [SalesDocument_dateIncoming_documentNumber] ON [dbo].[SalesDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SalesDocumentItem]    Script Date: 04.08.2026 2:25:40 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SalesDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[actualAmount] [numeric](19, 9) NULL,
	[actualUnitWeight] [numeric](19, 9) NULL,
	[code] [nvarchar](64) NULL,
	[comment] [nvarchar](255) NULL,
	[customsDeclarationNumber] [nvarchar](255) NULL,
	[discountSum] [numeric](19, 9) NULL,
	[expireDate] [datetime] NULL,
	[ndsPercent] [numeric](19, 9) NULL,
	[price] [numeric](19, 9) NULL,
	[priceUnit] [uniqueidentifier] NULL,
	[priceWithoutNds] [numeric](19, 9) NOT NULL,
	[store] [uniqueidentifier] NULL,
	[sum] [numeric](19, 9) NULL,
	[sumWithoutNds] [numeric](19, 9) NULL,
	[supplierProduct] [uniqueidentifier] NULL,
	[amountFactor] [numeric](19, 9) NOT NULL,
	[correctedAssemblyChartItems] [ntext] NULL,
	[productSize] [uniqueidentifier] NULL,
	[invoice_id] [uniqueidentifier] NOT NULL,
	[splitVat] [tinyint] NOT NULL,
 CONSTRAINT [PK_SalesDocumentItem_adb45210] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [SalesDocumentItem_invoice]    Script Date: 04.08.2026 2:25:41 ******/
CREATE CLUSTERED INDEX [SalesDocumentItem_invoice] ON [dbo].[SalesDocumentItem]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SavedImage]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SavedImage](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[checkSum] [nvarchar](255) NULL,
	[data] [image] NOT NULL,
	[usageNotFoundDate] [datetime] NULL,
 CONSTRAINT [PK_SavedImage_686bd81e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ScheduledIncoming]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ScheduledIncoming](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[cashFlowCategory] [uniqueidentifier] NULL,
	[conception] [uniqueidentifier] NULL,
	[counteragent] [uniqueidentifier] NULL,
	[department] [uniqueidentifier] NULL,
	[dueDate] [datetime] NOT NULL,
	[expenseAccount] [uniqueidentifier] NULL,
	[name] [nvarchar](255) NULL,
	[number] [nvarchar](255) NULL,
	[paid] [tinyint] NOT NULL,
	[paymentRequestId] [uniqueidentifier] NOT NULL,
	[paymentType] [int] NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[writeoffAccount] [uniqueidentifier] NULL,
 CONSTRAINT [PK_ScheduledIncoming_4fec763] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ScheduledIncomingRequest]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ScheduledIncomingRequest](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[cashFlowCategory] [uniqueidentifier] SPARSE  NULL,
	[counteragent] [uniqueidentifier] SPARSE  NULL,
	[departments] [ntext] NULL,
	[end] [datetime] NOT NULL,
	[expenseAccount] [uniqueidentifier] SPARSE  NULL,
	[name] [nvarchar](255) SPARSE  NULL,
	[period_type] [int] SPARSE  NULL,
	[period_value] [int] NOT NULL,
	[start] [datetime] NOT NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[writeoffAccount] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_ScheduledIncomingRequest_171222b1] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ScheduledIncomingRequest_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:41 ******/
CREATE CLUSTERED INDEX [ScheduledIncomingRequest_dateIncoming_documentNumber] ON [dbo].[ScheduledIncomingRequest]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ScheduledPayment]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ScheduledPayment](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[cashFlowCategory] [uniqueidentifier] NULL,
	[conception] [uniqueidentifier] NULL,
	[counteragent] [uniqueidentifier] NULL,
	[department] [uniqueidentifier] NULL,
	[dueDate] [datetime] NOT NULL,
	[expenseAccount] [uniqueidentifier] NULL,
	[name] [nvarchar](255) NULL,
	[number] [nvarchar](255) NULL,
	[paid] [tinyint] NOT NULL,
	[paymentRequestId] [uniqueidentifier] NOT NULL,
	[paymentType] [int] NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[writeoffAccount] [uniqueidentifier] NULL,
 CONSTRAINT [PK_ScheduledPayment_92ede17e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ScheduledPaymentRequest]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ScheduledPaymentRequest](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[cashFlowCategory] [uniqueidentifier] SPARSE  NULL,
	[counteragent] [uniqueidentifier] SPARSE  NULL,
	[departments] [ntext] NULL,
	[end] [datetime] NOT NULL,
	[expenseAccount] [uniqueidentifier] SPARSE  NULL,
	[name] [nvarchar](255) SPARSE  NULL,
	[period_type] [int] SPARSE  NULL,
	[period_value] [int] NOT NULL,
	[start] [datetime] NOT NULL,
	[sum] [numeric](19, 9) NOT NULL,
	[writeoffAccount] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_ScheduledPaymentRequest_6eb9cbd] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ScheduledPaymentRequest_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:41 ******/
CREATE CLUSTERED INDEX [ScheduledPaymentRequest_dateIncoming_documentNumber] ON [dbo].[ScheduledPaymentRequest]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ScheduledTaskEntity]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ScheduledTaskEntity](
	[dtype] [nvarchar](32) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[period] [int] SPARSE  NULL,
	[plannedDate] [datetime] SPARSE  NULL,
	[taxCategory] [uniqueidentifier] SPARSE  NULL,
	[cronExpression] [nvarchar](255) SPARSE  NULL,
	[sqlExpression] [nvarchar](255) SPARSE  NULL,
	[documentIds] [ntext] NULL,
	[periodClosingDate] [datetime] SPARSE  NULL,
 CONSTRAINT [PK_ScheduledTaskEntity_aab7caae] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SessionFullReport]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SessionFullReport](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[htmlText] [ntext] NULL,
	[sessionId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_SessionFullReport_c814b07e] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [SessionFullReport_date]    Script Date: 04.08.2026 2:25:41 ******/
CREATE CLUSTERED INDEX [SessionFullReport_date] ON [dbo].[SessionFullReport]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SessionRevenueEntry]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SessionRevenueEntry](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[closeEvent] [uniqueidentifier] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[employee] [uniqueidentifier] NOT NULL,
	[program] [uniqueidentifier] NOT NULL,
	[revenue] [numeric](19, 9) NULL,
	[revenueUnfiltered] [numeric](19, 9) NULL,
	[workedMinutes] [numeric](19, 9) NULL,
 CONSTRAINT [PK_SessionRevenueEntry_f1984fc6] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StopListItem]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StopListItem](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[groupId] [uniqueidentifier] NULL,
	[productId] [uniqueidentifier] NOT NULL,
	[productSizeId] [uniqueidentifier] NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[stopListItemType] [nvarchar](10) NOT NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[revisionPart] [int] NOT NULL,
	[timestamp] [numeric](19, 0) NOT NULL,
	[timestampId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_StopListItem_56f06ca0] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StoreSpecificationEntity]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StoreSpecificationEntity](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateTo] [datetime] NOT NULL,
	[storeSpecification] [ntext] NULL,
 CONSTRAINT [PK_StoreSpecificationEntity_5ac402d4] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Street]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Street](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[city] [uniqueidentifier] NULL,
	[deleted] [tinyint] NULL,
	[externalId] [nvarchar](255) NULL,
	[name] [nvarchar](255) NOT NULL,
	[revisionPart] [int] NOT NULL,
	[timestamp] [numeric](19, 0) NOT NULL,
	[timestampId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_Street_25c99c37] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SupplierPriceList]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SupplierPriceList](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[dateCreated] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[dateFrom] [datetime] NULL,
	[dateTo] [datetime] NULL,
	[dateModified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[supplier] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_SupplierPriceList_41a42981] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [SupplierPriceList_dateTo_supplier]    Script Date: 04.08.2026 2:25:41 ******/
CREATE CLUSTERED INDEX [SupplierPriceList_dateTo_supplier] ON [dbo].[SupplierPriceList]
(
	[dateTo] ASC,
	[supplier] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SupplierPriceListItem]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SupplierPriceListItem](
	[id] [uniqueidentifier] NOT NULL,
	[allowablePriceDeviation] [numeric](19, 9) NULL,
	[containerId] [uniqueidentifier] NOT NULL,
	[costPrice] [numeric](19, 9) NOT NULL,
	[deleted] [tinyint] NOT NULL,
	[nativeProduct] [uniqueidentifier] NOT NULL,
	[supplierProduct] [uniqueidentifier] NOT NULL,
	[priceList] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_SupplierPriceListItem_4b9e5669] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [SupplierPriceListItem_priceList]    Script Date: 04.08.2026 2:25:41 ******/
CREATE CLUSTERED INDEX [SupplierPriceListItem_priceList] ON [dbo].[SupplierPriceListItem]
(
	[priceList] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SurveyItemResponse]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SurveyItemResponse](
	[id] [uniqueidentifier] NOT NULL,
	[deliveryOrderId] [uniqueidentifier] NULL,
	[mark] [int] NOT NULL,
	[surveyItem] [uniqueidentifier] NOT NULL,
	[deliveryId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_SurveyItemResponse_26c9c30d] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SystemEvent]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SystemEvent](
	[id] [uniqueidentifier] NOT NULL,
	[instanceId] [uniqueidentifier] NOT NULL,
	[timestampDb] [datetimeoffset](7) NOT NULL,
	[dateTimeServer] [datetime] NOT NULL,
	[eventType] [nvarchar](20) NOT NULL,
	[description] [ntext] NOT NULL,
	[info_clientIpAddress] [nvarchar](255) NULL,
	[info_hostname] [nvarchar](255) NULL,
	[info_httpPort] [int] NULL,
	[info_serverVersion] [nvarchar](255) NULL,
	[info_startupDate] [datetime] NULL,
	[owner_crmId] [nvarchar](255) NULL,
	[owner_hwId] [nvarchar](255) NULL,
	[owner_dbId] [uniqueidentifier] NULL,
	[owner_installationPath] [nvarchar](255) NULL,
 CONSTRAINT [PK_SystemEvent_da9d95d6] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [SystemEvent_dateTimeServer]    Script Date: 04.08.2026 2:25:41 ******/
CREATE CLUSTERED INDEX [SystemEvent_dateTimeServer] ON [dbo].[SystemEvent]
(
	[dateTimeServer] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TerminalExchangeState]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TerminalExchangeState](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[currentSessions] [ntext] NULL,
	[entitiesUpdateDate] [datetime] NULL,
	[entitiesUpdateRevision] [int] NOT NULL,
	[lastActivityDate] [datetime] NULL,
	[queueImportErrorMessage] [ntext] NULL,
	[queueImportErrorStacktrace] [ntext] NULL,
	[queueImportLastDate] [datetime] NULL,
	[queueImportSuccessDate] [datetime] NULL,
	[queuePendingCount] [int] NULL,
	[terminal] [uniqueidentifier] NOT NULL,
	[terminalVersion] [nvarchar](255) NULL,
 CONSTRAINT [PK_TerminalExchangeState_d86ec0bd] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TerminalToken]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TerminalToken](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[created] [datetime] NULL,
	[userCreated] [uniqueidentifier] NULL,
	[modified] [datetime] NULL,
	[userModified] [uniqueidentifier] NULL,
	[secretHash] [nvarchar](255) NOT NULL,
	[status] [char](32) NOT NULL,
	[terminal] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_TerminalToken_37e60a8] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TerminalUpgradeState]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TerminalUpgradeState](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[checkResults] [ntext] NOT NULL,
	[dateReceived] [datetime] NOT NULL,
	[revisionSettings] [int] NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[targetVersion] [nvarchar](255) NULL,
	[terminal] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_TerminalUpgradeState_caa15de5] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TransformationDocument]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TransformationDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[storeFrom] [uniqueidentifier] SPARSE  NULL,
	[storeTo] [uniqueidentifier] SPARSE  NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[amountUnit] [uniqueidentifier] SPARSE  NULL,
	[containerId] [uniqueidentifier] SPARSE  NULL,
	[product] [uniqueidentifier] NOT NULL,
	[assemblyChartWriteoff] [tinyint] NOT NULL,
	[editable] [tinyint] NOT NULL,
	[isAutomatic] [tinyint] NOT NULL,
	[producer] [uniqueidentifier] SPARSE  NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_TransformationDocument_41691f85] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [TransformationDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:41 ******/
CREATE CLUSTERED INDEX [TransformationDocument_dateIncoming_documentNumber] ON [dbo].[TransformationDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TransformationDocumentItem]    Script Date: 04.08.2026 2:25:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TransformationDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountFactor] [numeric](19, 9) NOT NULL,
	[amountUnitFrom] [uniqueidentifier] NULL,
	[containerFromId] [uniqueidentifier] NULL,
	[containerToId] [uniqueidentifier] NULL,
	[productSize] [uniqueidentifier] NULL,
	[productTo] [uniqueidentifier] NULL,
	[document_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_TransformationDocumentItem_477d9b6b] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TreeMenuChangeDocument]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TreeMenuChangeDocument](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[dateTo] [datetime] NOT NULL,
	[deletePreviousMenu] [tinyint] SPARSE  NULL,
	[schedule] [ntext] NULL,
	[shortName] [nvarchar](255) SPARSE  NULL,
 CONSTRAINT [PK_TreeMenuChangeDocument_7edf1e78] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [TreeMenuChangeDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:42 ******/
CREATE CLUSTERED INDEX [TreeMenuChangeDocument_dateIncoming_documentNumber] ON [dbo].[TreeMenuChangeDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TreeMenuChangeDocumentItem]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TreeMenuChangeDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[containerId] [uniqueidentifier] NULL,
	[cookingPlaceType] [uniqueidentifier] NULL,
	[departments] [ntext] NOT NULL,
	[includeForCategories] [ntext] NOT NULL,
	[including] [tinyint] NOT NULL,
	[isDishOfDay] [tinyint] NULL,
	[isFlyerProgram] [tinyint] NULL,
	[newPrice] [numeric](19, 9) NULL,
	[num] [int] NOT NULL,
	[pricesForCategories] [ntext] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[productSize] [uniqueidentifier] NULL,
	[document_id] [uniqueidentifier] NOT NULL,
	[taxCategory_value] [uniqueidentifier] NULL,
	[taxCategory_enabled] [tinyint] NOT NULL,
 CONSTRAINT [PK_TreeMenuChangeDocumentItem_667943a2] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [TreeMenuChangeDocumentItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE CLUSTERED INDEX [TreeMenuChangeDocumentItem_document] ON [dbo].[TreeMenuChangeDocumentItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UpgradeScripts]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UpgradeScripts](
	[ExecutedScript] [varchar](100) NOT NULL,
	[ExecutionDate] [datetime] NULL,
	[BuildNumber] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[ExecutedScript] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserActionEvent]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserActionEvent](
	[dtype] [nvarchar](5) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] SPARSE  NULL,
	[auth_card_slip] [nvarchar](64) SPARSE  NULL,
	[auth_user] [uniqueidentifier] SPARSE  NULL,
	[comment] [nvarchar](2000) SPARSE  NULL,
	[eventType] [char](20) SPARSE  NULL,
	[session_group] [uniqueidentifier] SPARSE  NULL,
	[session_id] [uniqueidentifier] SPARSE  NULL,
	[session_number] [int] SPARSE  NULL,
	[terminal] [uniqueidentifier] SPARSE  NULL,
	[user] [uniqueidentifier] SPARSE  NULL,
	[createdComment] [nvarchar](2000) SPARSE  NULL,
	[createdInfo_date] [datetime] SPARSE  NULL,
	[createdInfo_user] [uniqueidentifier] SPARSE  NULL,
	[employee] [uniqueidentifier] SPARSE  NULL,
	[penaltyOrBonusType] [uniqueidentifier] SPARSE  NULL,
	[sum] [numeric](19, 9) NULL,
	[dateOpened] [datetime] SPARSE  NULL,
	[role] [uniqueidentifier] SPARSE  NULL,
	[account] [uniqueidentifier] SPARSE  NULL,
	[accountTo] [uniqueidentifier] SPARSE  NULL,
	[actualDate] [datetime] SPARSE  NULL,
	[cashFlowCategory] [uniqueidentifier] SPARSE  NULL,
	[cashRegister] [uniqueidentifier] SPARSE  NULL,
	[cashier] [uniqueidentifier] SPARSE  NULL,
	[counterAgent] [uniqueidentifier] SPARSE  NULL,
	[paymentOwner] [nvarchar](255) SPARSE  NULL,
	[type] [char](20) SPARSE  NULL,
	[acceptDate] [datetime] SPARSE  NULL,
	[accountingReasonCode] [nvarchar](255) SPARSE  NULL,
	[cashDiff] [numeric](19, 9) NULL,
	[cashRegNumber] [int] SPARSE  NULL,
	[cashRegSerial] [nvarchar](255) SPARSE  NULL,
	[cashRemain] [numeric](19, 9) NULL,
	[closeDate] [datetime] SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[fiscalNumber] [int] SPARSE  NULL,
	[manager] [uniqueidentifier] SPARSE  NULL,
	[openDate] [datetime] SPARSE  NULL,
	[payIn] [numeric](19, 9) NULL,
	[payIncome] [numeric](19, 9) NULL,
	[payOrders] [numeric](19, 9) NULL,
	[payOut] [numeric](19, 9) NULL,
	[pointOfSale] [uniqueidentifier] SPARSE  NULL,
	[responsibleUser] [uniqueidentifier] SPARSE  NULL,
	[salesCard] [numeric](19, 9) NULL,
	[salesCash] [numeric](19, 9) NULL,
	[salesCredit] [numeric](19, 9) NULL,
	[sessionNumber] [int] SPARSE  NULL,
	[sessionStartCash] [numeric](19, 9) NULL,
	[sessionStatus] [int] SPARSE  NULL,
	[sumWriteoffOrders] [numeric](19, 9) NULL,
	[taxpayerIdNumber] [nvarchar](255) SPARSE  NULL,
	[transactionDate] [datetime] SPARSE  NULL,
 CONSTRAINT [PK_UserActionEvent_eb07fde4] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [UserActionEvent_date]    Script Date: 04.08.2026 2:25:42 ******/
CREATE CLUSTERED INDEX [UserActionEvent_date] ON [dbo].[UserActionEvent]
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserEvent]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserEvent](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[date] [datetime] NOT NULL,
	[department] [uniqueidentifier] NULL,
	[eventType] [nvarchar](255) NULL,
 CONSTRAINT [PK_UserEvent_680b805c] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [UserEvent_date_id]    Script Date: 04.08.2026 2:25:42 ******/
CREATE CLUSTERED INDEX [UserEvent_date_id] ON [dbo].[UserEvent]
(
	[date] ASC,
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserEventAttribute]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserEventAttribute](
	[date] [datetime] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[event_id] [uniqueidentifier] NOT NULL,
	[type] [nvarchar](255) SPARSE  NULL,
	[valueDate] [datetime] SPARSE  NULL,
	[valueGuid] [uniqueidentifier] SPARSE  NULL,
	[valueNumber] [numeric](19, 9) NULL,
	[valueString] [ntext] NULL,
 CONSTRAINT [PK_UserEventAttribute_31419b3e] PRIMARY KEY CLUSTERED 
(
	[date] ASC,
	[event_id] ASC,
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UtmDocumentStatus]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UtmDocumentStatus](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] NULL,
	[revision] [int] NOT NULL,
	[badAttemptsToProcessRequest] [int] NOT NULL,
	[errorMessage] [ntext] NULL,
	[fileName] [nvarchar](255) NULL,
	[presence] [nvarchar](10) NULL,
	[processingDate] [datetime] NULL,
	[query] [nvarchar](255) NULL,
	[replyId] [nvarchar](255) NULL,
	[sourceRarId] [nvarchar](255) NULL,
	[status] [nvarchar](20) NULL,
	[toDeleteRequest] [tinyint] NOT NULL,
	[toProcessRequest] [tinyint] NOT NULL,
	[type] [nvarchar](4) NULL,
 CONSTRAINT [PK_UtmDocumentStatus_dd501a12] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VatInvoice]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VatInvoice](
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[cashRegisterNumber] [int] SPARSE  NULL,
	[customerId] [uniqueidentifier] NOT NULL,
	[department] [uniqueidentifier] NOT NULL,
	[fiscalChequeNumber] [nvarchar](255) SPARSE  NULL,
	[fiscalRegisterNumber] [nvarchar](255) SPARSE  NULL,
	[orderNumber] [int] SPARSE  NULL,
	[sessionNumber] [int] SPARSE  NULL,
 CONSTRAINT [PK_VatInvoice_b9a70ead] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [VatInvoice_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:42 ******/
CREATE CLUSTERED INDEX [VatInvoice_dateIncoming_documentNumber] ON [dbo].[VatInvoice]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WriteoffDocument]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WriteoffDocument](
	[DTYPE] [nvarchar](31) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[lastModifyNode] [uniqueidentifier] SPARSE  NULL,
	[revision] [int] NOT NULL,
	[comment] [nvarchar](255) SPARSE  NULL,
	[conception] [uniqueidentifier] SPARSE  NULL,
	[dateCreated] [datetime] SPARSE  NULL,
	[userCreated] [uniqueidentifier] SPARSE  NULL,
	[dateIncoming] [datetime] NOT NULL,
	[disableUserSaving] [tinyint] SPARSE  NULL,
	[documentNumber] [nvarchar](255) NOT NULL,
	[dateModified] [datetime] SPARSE  NULL,
	[userModified] [uniqueidentifier] SPARSE  NULL,
	[status] [int] SPARSE  NULL,
	[accountTo] [uniqueidentifier] NOT NULL,
	[counteragentTo] [uniqueidentifier] SPARSE  NULL,
	[editable] [tinyint] SPARSE  NULL,
	[isAutomatic] [tinyint] SPARSE  NULL,
	[isCorrected] [tinyint] SPARSE  NULL,
	[operationalDayId] [uniqueidentifier] SPARSE  NULL,
	[sessionId] [uniqueidentifier] SPARSE  NULL,
	[store] [uniqueidentifier] NOT NULL,
	[externalOutgoingInvoiceId] [uniqueidentifier] SPARSE  NULL,
	[externalProductionDocumentId] [uniqueidentifier] SPARSE  NULL,
 CONSTRAINT [PK_WriteoffDocument_d5cfeb61] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [WriteoffDocument_dateIncoming_documentNumber]    Script Date: 04.08.2026 2:25:42 ******/
CREATE CLUSTERED INDEX [WriteoffDocument_dateIncoming_documentNumber] ON [dbo].[WriteoffDocument]
(
	[dateIncoming] ASC,
	[documentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WriteoffDocumentItem]    Script Date: 04.08.2026 2:25:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WriteoffDocumentItem](
	[id] [uniqueidentifier] NOT NULL,
	[amount] [numeric](19, 9) NOT NULL,
	[num] [int] NOT NULL,
	[product] [uniqueidentifier] NOT NULL,
	[amountUnit] [uniqueidentifier] NULL,
	[containerId] [uniqueidentifier] NULL,
	[amountFactor] [numeric](19, 9) NOT NULL,
	[correctedAssemblyChartItems] [ntext] NULL,
	[productSize] [uniqueidentifier] NULL,
	[writeoffDocument_id] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_WriteoffDocumentItem_6482e88a] PRIMARY KEY NONCLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AbstractDeliveryOrder_courier_deliveryStatus_dtype]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AbstractDeliveryOrder_courier_deliveryStatus_dtype] ON [dbo].[AbstractDeliveryOrder]
(
	[courier] ASC,
	[deliveryStatus] ASC,
	[dtype] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [AbstractDeliveryOrder_customerId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AbstractDeliveryOrder_customerId] ON [dbo].[AbstractDeliveryOrder]
(
	[customerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AbstractDeliveryOrder_deliveryStatus_dtype_problem_hasProblem_forceClosed]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AbstractDeliveryOrder_deliveryStatus_dtype_problem_hasProblem_forceClosed] ON [dbo].[AbstractDeliveryOrder]
(
	[deliveryStatus] ASC,
	[dtype] ASC,
	[problem_hasProblem] ASC,
	[forceClosed] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [AbstractDeliveryOrder_draft_deliveryOrderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AbstractDeliveryOrder_draft_deliveryOrderId] ON [dbo].[AbstractDeliveryOrder]
(
	[deliveryOrderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AbstractDeliveryOrder_dtype]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AbstractDeliveryOrder_dtype] ON [dbo].[AbstractDeliveryOrder]
(
	[dtype] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [AbstractDeliveryOrder_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AbstractDeliveryOrder_revision] ON [dbo].[AbstractDeliveryOrder]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AbstractDeliveryOrder_terminalId_deliveryStatus_dtype]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AbstractDeliveryOrder_terminalId_deliveryStatus_dtype] ON [dbo].[AbstractDeliveryOrder]
(
	[terminalId] ASC,
	[deliveryStatus] ASC,
	[dtype] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AbstractDeliveryOrder_terminalId_dtype_forceClosed_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AbstractDeliveryOrder_terminalId_dtype_forceClosed_revision] ON [dbo].[AbstractDeliveryOrder]
(
	[terminalId] ASC,
	[dtype] ASC,
	[forceClosed] ASC,
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [AccountingTransaction_attendanceEntry]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_attendanceEntry] ON [dbo].[AccountingTransaction]
(
	[attendanceEntry_id] ASC
)
WHERE ([attendanceEntry_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AccountingTransaction_cashOrderNumber]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_cashOrderNumber] ON [dbo].[AccountingTransaction]
(
	[cashOrderNumber] ASC
)
WHERE ([cashOrderNumber] IS NOT NULL AND [cashOrderNumber]<>'')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [AccountingTransaction_causeEvent]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_causeEvent] ON [dbo].[AccountingTransaction]
(
	[causeEvent_id] ASC
)
WHERE ([causeEvent_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [AccountingTransaction_department_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_department_revision] ON [dbo].[AccountingTransaction]
(
	[department] ASC,
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [AccountingTransaction_documentId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_documentId] ON [dbo].[AccountingTransaction]
(
	[documentId] ASC
)
WHERE ([documentId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AccountingTransaction_OlapSalesReport]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_OlapSalesReport] ON [dbo].[AccountingTransaction]
(
	[orderId] ASC,
	[dtype] ASC,
	[date] ASC
)
INCLUDE ( 	[sum],
	[sumNds],
	[to_account],
	[type],
	[paymentType],
	[to_counteragent],
	[cardNumber],
	[cardOwnerCompany],
	[cardTypeName],
	[currency],
	[currencyRate],
	[sumInCurrency]) 
WHERE ([orderId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [AccountingTransaction_orderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_orderId] ON [dbo].[AccountingTransaction]
(
	[orderId] ASC
)
WHERE ([orderId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AccountingTransaction_paymentType_type_orderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_paymentType_type_orderId] ON [dbo].[AccountingTransaction]
(
	[paymentType] ASC,
	[type] ASC,
	[orderId] ASC
)
INCLUDE ( 	[sum]) 
WHERE ([paymentType] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AccountingTransaction_SalaryReport_From]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_SalaryReport_From] ON [dbo].[AccountingTransaction]
(
	[from_account] ASC,
	[date] ASC,
	[department] ASC,
	[from_counteragent] ASC
)
INCLUDE ( 	[sum],
	[to_account],
	[type],
	[penaltyOrBonusType],
	[documentId]) 
WHERE ([from_account]='13000ead-41f0-d569-d85c-704242cc91f5')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AccountingTransaction_SalaryReport_To]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_SalaryReport_To] ON [dbo].[AccountingTransaction]
(
	[to_account] ASC,
	[date] ASC,
	[department] ASC,
	[to_counteragent] ASC
)
INCLUDE ( 	[sum],
	[from_account],
	[type],
	[penaltyOrBonusType],
	[documentId]) 
WHERE ([to_account]='13000ead-41f0-d569-d85c-704242cc91f5')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [AccountingTransaction_scheduleItem]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_scheduleItem] ON [dbo].[AccountingTransaction]
(
	[scheduleItem_id] ASC
)
WHERE ([scheduleItem_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [AccountingTransaction_session]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_session] ON [dbo].[AccountingTransaction]
(
	[session_id] ASC
)
WHERE ([session_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [AccountingTransaction_type]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AccountingTransaction_type] ON [dbo].[AccountingTransaction]
(
	[type] ASC
)
INCLUDE ( 	[id]) 
WHERE ([type]<>'SWROFF' AND [type]<>'OUTINV' AND [type]<>'WROFF' AND [type]<>'PROD' AND [type]<>'TRANS' AND [type]<>'SRWRF')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Announcement_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Announcement_revision] ON [dbo].[Announcement]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [AssemblyChart_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AssemblyChart_revision] ON [dbo].[AssemblyChart]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [AssemblyChartItem_product]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [AssemblyChartItem_product] ON [dbo].[AssemblyChartItem]
(
	[product] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ATransactionSumSession_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ATransactionSumSession_revision] ON [dbo].[ATransactionSumSession]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [ATransactionSumSession_Session]    Script Date: 04.08.2026 2:25:42 ******/
CREATE UNIQUE NONCLUSTERED INDEX [ATransactionSumSession_Session] ON [dbo].[ATransactionSumSession]
(
	[session_id] ASC,
	[from_account] ASC,
	[to_product] ASC,
	[to_productSize] ASC,
	[date] ASC
)
INCLUDE ( 	[sum],
	[to_amount]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [BudgetPlan_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [BudgetPlan_revision] ON [dbo].[BudgetPlan]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [BudgetPlanItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [BudgetPlanItem_revision] ON [dbo].[BudgetPlanItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CardTransaction_orderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CardTransaction_orderId] ON [dbo].[CardTransaction]
(
	[orderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CardTransaction_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CardTransaction_revision] ON [dbo].[CardTransaction]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CashRegisterToken_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CashRegisterToken_revision] ON [dbo].[CashRegisterToken]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ClosedSessionDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ClosedSessionDocument_revision] ON [dbo].[ClosedSessionDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ClosedSessionDocumentItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ClosedSessionDocumentItem_document] ON [dbo].[ClosedSessionDocumentItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ConsolidatedOrderDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ConsolidatedOrderDocument_revision] ON [dbo].[ConsolidatedOrderDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ConsolidatedOrderItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ConsolidatedOrderItem_document] ON [dbo].[ConsolidatedOrderItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ConsolidatedVatInvoiceItem_vatInvoice]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ConsolidatedVatInvoiceItem_vatInvoice] ON [dbo].[ConsolidatedVatInvoiceItem]
(
	[vatInvoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CrmCard_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CrmCard_revision] ON [dbo].[CrmCard]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CrmCounteragent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CrmCounteragent_revision] ON [dbo].[CrmCounteragent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CrmDiscountMapping_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CrmDiscountMapping_revision] ON [dbo].[CrmDiscountMapping]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CrmIikoCardMapping_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CrmIikoCardMapping_revision] ON [dbo].[CrmIikoCardMapping]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CrmUserMapping_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CrmUserMapping_revision] ON [dbo].[CrmUserMapping]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [CurrencyRate_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CurrencyRate_revision] ON [dbo].[CurrencyRate]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Customer_blackListInfo_inBlackList_deleted_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Customer_blackListInfo_inBlackList_deleted_revision] ON [dbo].[Customer]
(
	[blackListInfo_inBlackList] ASC,
	[deleted] ASC,
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [Customer_consentDateTo]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Customer_consentDateTo] ON [dbo].[Customer]
(
	[consentDateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [Customer_counteragentInfo_accountingReasonCode_deleted]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Customer_counteragentInfo_accountingReasonCode_deleted] ON [dbo].[Customer]
(
	[counteragentInfo_accountingReasonCode] ASC,
	[deleted] ASC
)
WHERE ([counteragentInfo_accountingReasonCode] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [Customer_counteragentInfo_code_deleted]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Customer_counteragentInfo_code_deleted] ON [dbo].[Customer]
(
	[counteragentInfo_code] ASC,
	[deleted] ASC
)
WHERE ([counteragentInfo_code] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [Customer_processingDateTo]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Customer_processingDateTo] ON [dbo].[Customer]
(
	[processingDateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [Customer_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Customer_revision] ON [dbo].[Customer]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [Customer_revision_revisionPart_id]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Customer_revision_revisionPart_id] ON [dbo].[Customer]
(
	[revision] ASC,
	[revisionPart] ASC,
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [CustomersAddresses_customerId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CustomersAddresses_customerId] ON [dbo].[CustomersAddresses]
(
	[customerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [CustomersEmails_customerId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CustomersEmails_customerId] ON [dbo].[CustomersEmails]
(
	[customerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [CustomersPhones_customerId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CustomersPhones_customerId] ON [dbo].[CustomersPhones]
(
	[customerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [CustomersPhones_phones_element_phoneNumber]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [CustomersPhones_phones_element_phoneNumber] ON [dbo].[CustomersPhones]
(
	[phones_element_phoneNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DataItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DataItem_revision] ON [dbo].[DataItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [DataItem_uri]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DataItem_uri] ON [dbo].[DataItem]
(
	[uri] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeletedEntity_deletedEntityId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeletedEntity_deletedEntityId] ON [dbo].[DeletedEntity]
(
	[deletedEntityId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [DeletedEntity_entityType_revision_departmentId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeletedEntity_entityType_revision_departmentId] ON [dbo].[DeletedEntity]
(
	[entityType] ASC,
	[revision] ASC,
	[departmentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeletedEntity_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeletedEntity_revision] ON [dbo].[DeletedEntity]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Delivery_customerId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Delivery_customerId] ON [dbo].[Delivery]
(
	[customerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [Delivery_group]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Delivery_group] ON [dbo].[Delivery]
(
	[group] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [Delivery_orderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Delivery_orderId] ON [dbo].[Delivery]
(
	[orderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [Delivery_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Delivery_revision] ON [dbo].[Delivery]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [Delivery_status]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Delivery_status] ON [dbo].[Delivery]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryAppliedManualCondition_deliveryOrderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryAppliedManualCondition_deliveryOrderId] ON [dbo].[DeliveryAppliedManualCondition]
(
	[deliveryOrderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryCourierLocation_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryCourierLocation_revision] ON [dbo].[DeliveryCourierLocation]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryDiscount_deliveryOrder]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryDiscount_deliveryOrder] ON [dbo].[DeliveryDiscount]
(
	[deliveryOrder_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryDiscount_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryDiscount_revision] ON [dbo].[DeliveryDiscount]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryModifiers_deliveryOrderItemId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryModifiers_deliveryOrderItemId] ON [dbo].[DeliveryModifiers]
(
	[deliveryOrderItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryOrderComboInfo_deliveryOrder]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryOrderComboInfo_deliveryOrder] ON [dbo].[DeliveryOrderComboInfo]
(
	[deliveryOrder_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryOrderComboInfo_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryOrderComboInfo_revision] ON [dbo].[DeliveryOrderComboInfo]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryOrderGuest_deliveryOrder]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryOrderGuest_deliveryOrder] ON [dbo].[DeliveryOrderGuest]
(
	[deliveryOrder_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryOrderGuest_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryOrderGuest_revision] ON [dbo].[DeliveryOrderGuest]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryOrderItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryOrderItem_revision] ON [dbo].[DeliveryOrderItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryPaymentItem_deliveryOrder]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryPaymentItem_deliveryOrder] ON [dbo].[DeliveryPaymentItem]
(
	[deliveryOrder_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [DeliveryPaymentItem_dtype]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryPaymentItem_dtype] ON [dbo].[DeliveryPaymentItem]
(
	[dtype] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryPaymentItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryPaymentItem_revision] ON [dbo].[DeliveryPaymentItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryStopListItem_deliveryTerminalId_product]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryStopListItem_deliveryTerminalId_product] ON [dbo].[DeliveryStopListItem]
(
	[deliveryTerminalId] ASC,
	[product] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryStopListItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryStopListItem_revision] ON [dbo].[DeliveryStopListItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryTerminal_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryTerminal_revision] ON [dbo].[DeliveryTerminal]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DeliveryTerminalExchangeState_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DeliveryTerminalExchangeState_revision] ON [dbo].[DeliveryTerminalExchangeState]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [deliveryTerminalExchangeState_terminal]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [deliveryTerminalExchangeState_terminal] ON [dbo].[DeliveryTerminalExchangeState]
(
	[terminalId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DetailedVatInvoice_customerId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DetailedVatInvoice_customerId] ON [dbo].[DetailedVatInvoice]
(
	[customerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DetailedVatInvoice_department]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DetailedVatInvoice_department] ON [dbo].[DetailedVatInvoice]
(
	[department] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DetailedVatInvoice_orderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DetailedVatInvoice_orderId] ON [dbo].[DetailedVatInvoice]
(
	[orderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DetailedVatInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DetailedVatInvoice_revision] ON [dbo].[DetailedVatInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DetailedVatInvoiceItem_vatInvoice]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DetailedVatInvoiceItem_vatInvoice] ON [dbo].[DetailedVatInvoiceItem]
(
	[vatInvoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DisassembleDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DisassembleDocument_revision] ON [dbo].[DisassembleDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DisassembleDocumentItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DisassembleDocumentItem_document] ON [dbo].[DisassembleDocumentItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [DocumentNumberingState_key]    Script Date: 04.08.2026 2:25:42 ******/
CREATE UNIQUE NONCLUSTERED INDEX [DocumentNumberingState_key] ON [dbo].[DocumentNumberingState]
(
	[year] ASC,
	[documentType] ASC,
	[department] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [DocumentNumberingState_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [DocumentNumberingState_revision] ON [dbo].[DocumentNumberingState]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EdiOrderDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EdiOrderDocument_revision] ON [dbo].[EdiOrderDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisBalanceDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisBalanceDocument_revision] ON [dbo].[EgaisBalanceDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisBalanceDocumentItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisBalanceDocumentItem_document] ON [dbo].[EgaisBalanceDocumentItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisIncomingInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisIncomingInvoice_revision] ON [dbo].[EgaisIncomingInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisIncomingInvoiceItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisIncomingInvoiceItem_document] ON [dbo].[EgaisIncomingInvoiceItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkBalanceQuery_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkBalanceQuery_revision] ON [dbo].[EgaisMarkBalanceQuery]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkBalanceQueryItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkBalanceQueryItem_document] ON [dbo].[EgaisMarkBalanceQueryItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkConfirm_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkConfirm_revision] ON [dbo].[EgaisMarkConfirm]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkConfirmItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkConfirmItem_document] ON [dbo].[EgaisMarkConfirmItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkFirstPartialWriteoffInfo_documentId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkFirstPartialWriteoffInfo_documentId] ON [dbo].[EgaisMarkFirstPartialWriteoffInfo]
(
	[documentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkFirstPartialWriteoffInfo_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkFirstPartialWriteoffInfo_revision] ON [dbo].[EgaisMarkFirstPartialWriteoffInfo]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkFix_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkFix_revision] ON [dbo].[EgaisMarkFix]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkFixItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkFixItem_document] ON [dbo].[EgaisMarkFixItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkState_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkState_revision] ON [dbo].[EgaisMarkState]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkTableItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkTableItem_revision] ON [dbo].[EgaisMarkTableItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkUnFix_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkUnFix_revision] ON [dbo].[EgaisMarkUnFix]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisMarkUnFixItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisMarkUnFixItem_document] ON [dbo].[EgaisMarkUnFixItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisOrganizationEntity_clientRegId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE UNIQUE NONCLUSTERED INDEX [EgaisOrganizationEntity_clientRegId] ON [dbo].[EgaisOrganizationEntity]
(
	[clientRegId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisOrganizationEntity_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisOrganizationEntity_revision] ON [dbo].[EgaisOrganizationEntity]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisOutgoingInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisOutgoingInvoice_revision] ON [dbo].[EgaisOutgoingInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisOutgoingInvoiceItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisOutgoingInvoiceItem_document] ON [dbo].[EgaisOutgoingInvoiceItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisProductEntity_alcCode]    Script Date: 04.08.2026 2:25:42 ******/
CREATE UNIQUE NONCLUSTERED INDEX [EgaisProductEntity_alcCode] ON [dbo].[EgaisProductEntity]
(
	[alcCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisProductEntity_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisProductEntity_revision] ON [dbo].[EgaisProductEntity]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryFormA_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryFormA_revision] ON [dbo].[EgaisQueryFormA]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryFormAItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryFormAItem_document] ON [dbo].[EgaisQueryFormAItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryNotAnsweredInvoices_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryNotAnsweredInvoices_revision] ON [dbo].[EgaisQueryNotAnsweredInvoices]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryNotAnsweredInvoicesItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryNotAnsweredInvoicesItem_document] ON [dbo].[EgaisQueryNotAnsweredInvoicesItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryOrganization_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryOrganization_revision] ON [dbo].[EgaisQueryOrganization]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryOrganizationItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryOrganizationItem_document] ON [dbo].[EgaisQueryOrganizationItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryProduct_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryProduct_revision] ON [dbo].[EgaisQueryProduct]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryProductItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryProductItem_document] ON [dbo].[EgaisQueryProductItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryResendInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryResendInvoice_revision] ON [dbo].[EgaisQueryResendInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisQueryResendInvoiceItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisQueryResendInvoiceItem_document] ON [dbo].[EgaisQueryResendInvoiceItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisReplyFormA_aRegId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE UNIQUE NONCLUSTERED INDEX [EgaisReplyFormA_aRegId] ON [dbo].[EgaisReplyFormA]
(
	[aRegId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisReplyFormA_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisReplyFormA_revision] ON [dbo].[EgaisReplyFormA]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisRequestRepeal_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisRequestRepeal_revision] ON [dbo].[EgaisRequestRepeal]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisRequestRepealItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisRequestRepealItem_document] ON [dbo].[EgaisRequestRepealItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisSaleEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisSaleEvent_revision] ON [dbo].[EgaisSaleEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [EgaisSaleEvent_sourceRarId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisSaleEvent_sourceRarId] ON [dbo].[EgaisSaleEvent]
(
	[sourceRarId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisSaleEventItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisSaleEventItem_revision] ON [dbo].[EgaisSaleEventItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisSaleEventItem_saleEventId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisSaleEventItem_saleEventId] ON [dbo].[EgaisSaleEventItem]
(
	[saleEventId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisSalesDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisSalesDocument_revision] ON [dbo].[EgaisSalesDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisSalesDocumentItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisSalesDocumentItem_document] ON [dbo].[EgaisSalesDocumentItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopIncoming_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisShopIncoming_revision] ON [dbo].[EgaisShopIncoming]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopIncomingItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisShopIncomingItem_document] ON [dbo].[EgaisShopIncomingItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopIncomingLink_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisShopIncomingLink_document] ON [dbo].[EgaisShopIncomingLink]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopTransfer_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisShopTransfer_revision] ON [dbo].[EgaisShopTransfer]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopTransferItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisShopTransferItem_document] ON [dbo].[EgaisShopTransferItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopWriteoff_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisShopWriteoff_revision] ON [dbo].[EgaisShopWriteoff]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopWriteoffItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisShopWriteoffItem_document] ON [dbo].[EgaisShopWriteoffItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisShopWriteoffLink_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisShopWriteoffLink_document] ON [dbo].[EgaisShopWriteoffLink]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisTransactionPart_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisTransactionPart_revision] ON [dbo].[EgaisTransactionPart]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisUnsealEvent_documentId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisUnsealEvent_documentId] ON [dbo].[EgaisUnsealEvent]
(
	[documentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EgaisUnsealEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EgaisUnsealEvent_revision] ON [dbo].[EgaisUnsealEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAttendanceEntry_employee_dateFrom]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeAttendanceEntry_employee_dateFrom] ON [dbo].[EmployeeAttendanceEntry]
(
	[employee] ASC,
	[dateFrom] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAttendanceEntry_employee_dateTo]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeAttendanceEntry_employee_dateTo] ON [dbo].[EmployeeAttendanceEntry]
(
	[employee] ASC,
	[dateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAttendanceEntry_employee_personalSessionEnd]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeAttendanceEntry_employee_personalSessionEnd] ON [dbo].[EmployeeAttendanceEntry]
(
	[employee] ASC,
	[personalSessionEnd] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAttendanceEntry_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeAttendanceEntry_revision] ON [dbo].[EmployeeAttendanceEntry]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAttendanceEntry_salaryDepartment]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeAttendanceEntry_salaryDepartment] ON [dbo].[EmployeeAttendanceEntry]
(
	[salaryDepartment] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAvailabilityEntry_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeAvailabilityEntry_revision] ON [dbo].[EmployeeAvailabilityEntry]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeAvailabilitySchedule_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeAvailabilitySchedule_revision] ON [dbo].[EmployeeAvailabilitySchedule]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeScheduleItem_employee_dateFrom]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeScheduleItem_employee_dateFrom] ON [dbo].[EmployeeScheduleItem]
(
	[employee] ASC,
	[dateFrom] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeScheduleItem_employee_dateTo]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeScheduleItem_employee_dateTo] ON [dbo].[EmployeeScheduleItem]
(
	[employee] ASC,
	[dateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeScheduleItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeScheduleItem_revision] ON [dbo].[EmployeeScheduleItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [EmployeeScheduleItem_salaryDepartment]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [EmployeeScheduleItem_salaryDepartment] ON [dbo].[EmployeeScheduleItem]
(
	[salaryDepartment] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [entity_deleted]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [entity_deleted] ON [dbo].[entity]
(
	[deleted] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [entity_lastModifyNode]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [entity_lastModifyNode] ON [dbo].[entity]
(
	[lastModifyNode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [entity_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [entity_revision] ON [dbo].[entity]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [entity_type_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [entity_type_revision] ON [dbo].[entity]
(
	[type] ASC,
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ForcedReplicationClass_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ForcedReplicationClass_revision] ON [dbo].[ForcedReplicationClass]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IikoNetExchangeEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IikoNetExchangeEvent_revision] ON [dbo].[IikoNetExchangeEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingInventory_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingInventory_revision] ON [dbo].[IncomingInventory]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingInventoryItem_inventory]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingInventoryItem_inventory] ON [dbo].[IncomingInventoryItem]
(
	[inventory_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IncomingInvoice_incomingDocumentNumber]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingInvoice_incomingDocumentNumber] ON [dbo].[IncomingInvoice]
(
	[incomingDocumentNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingInvoice_revision] ON [dbo].[IncomingInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingInvoiceItem_store]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingInvoiceItem_store] ON [dbo].[IncomingInvoiceItem]
(
	[store] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingReturnedInvoice_outgoingInvoiceId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingReturnedInvoice_outgoingInvoiceId] ON [dbo].[IncomingReturnedInvoice]
(
	[outgoingInvoiceId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingReturnedInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingReturnedInvoice_revision] ON [dbo].[IncomingReturnedInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingReturnedInvoiceItem_store]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingReturnedInvoiceItem_store] ON [dbo].[IncomingReturnedInvoiceItem]
(
	[store] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingService_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingService_revision] ON [dbo].[IncomingService]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IncomingServiceItem_store]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IncomingServiceItem_store] ON [dbo].[IncomingServiceItem]
(
	[store] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [IndependentPriceList_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [IndependentPriceList_revision] ON [dbo].[IndependentPriceList]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [InternalTransfer_idPreparedRegisterDocument]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [InternalTransfer_idPreparedRegisterDocument] ON [dbo].[InternalTransfer]
(
	[idPreparedRegisterDocument] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [InternalTransfer_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [InternalTransfer_revision] ON [dbo].[InternalTransfer]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [InternalTransferItem_transfer]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [InternalTransferItem_transfer] ON [dbo].[InternalTransferItem]
(
	[transfer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemCookingEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemCookingEvent_revision] ON [dbo].[ItemCookingEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemCookingEvent_saleItemId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemCookingEvent_saleItemId] ON [dbo].[ItemCookingEvent]
(
	[saleItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEvent_DbGuidsFilter]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemSaleEvent_DbGuidsFilter] ON [dbo].[ItemSaleEvent]
(
	[id] ASC
)
WHERE ([discountSums] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEvent_ItemSaleEventDiscount]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemSaleEvent_ItemSaleEventDiscount] ON [dbo].[ItemSaleEvent]
(
	[date] ASC,
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEvent_orderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemSaleEvent_orderId] ON [dbo].[ItemSaleEvent]
(
	[orderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEvent_PersonalReport]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemSaleEvent_PersonalReport] ON [dbo].[ItemSaleEvent]
(
	[waiter] ASC,
	[date] ASC,
	[department] ASC
)
INCLUDE ( 	[deletedWithWriteoff],
	[orderId],
	[dishDiscountSum]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemSaleEvent_revision] ON [dbo].[ItemSaleEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEvent_session]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemSaleEvent_session] ON [dbo].[ItemSaleEvent]
(
	[session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEventDiscount_itemSaleEventId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemSaleEventDiscount_itemSaleEventId] ON [dbo].[ItemSaleEventDiscount]
(
	[itemSaleEventId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ItemSaleEventDiscount_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ItemSaleEventDiscount_revision] ON [dbo].[ItemSaleEventDiscount]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [MappingElement_elementType_transferType_externalElementId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [MappingElement_elementType_transferType_externalElementId] ON [dbo].[MappingElement]
(
	[elementType] ASC,
	[transferType] ASC,
	[externalElementId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [MappingElement_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [MappingElement_revision] ON [dbo].[MappingElement]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Notice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Notice_revision] ON [dbo].[Notice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderBonusEvent_order_cancelled]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderBonusEvent_order_cancelled] ON [dbo].[OrderBonusEvent]
(
	[order_id] ASC,
	[cancelled] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderBonusEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderBonusEvent_revision] ON [dbo].[OrderBonusEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderCustomer_customerId_orderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderCustomer_customerId_orderId] ON [dbo].[OrderCustomer]
(
	[customerId] ASC,
	[orderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderCustomer_orderPaymentEventId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderCustomer_orderPaymentEventId] ON [dbo].[OrderCustomer]
(
	[orderPaymentEventId] ASC
)
INCLUDE ( 	[customerId],
	[orderId],
	[date]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_groupOrderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderPaymentEvent_groupOrderId] ON [dbo].[OrderPaymentEvent]
(
	[groupOrderId] ASC
)
WHERE ([groupOrderId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_GroupSourceRelatedOrders]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderPaymentEvent_GroupSourceRelatedOrders] ON [dbo].[OrderPaymentEvent]
(
	[date] ASC,
	[groupOrderId] ASC
)
INCLUDE ( 	[groupOrderNum],
	[sourceOrderId],
	[sourceOrderNum],
	[id],
	[order],
	[orderNum]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_order]    Script Date: 04.08.2026 2:25:42 ******/
CREATE UNIQUE NONCLUSTERED INDEX [OrderPaymentEvent_order] ON [dbo].[OrderPaymentEvent]
(
	[order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_PersonalReport]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderPaymentEvent_PersonalReport] ON [dbo].[OrderPaymentEvent]
(
	[waiter] ASC,
	[date] ASC,
	[department] ASC
)
INCLUDE ( 	[orderDeleted],
	[storned],
	[orderSumAfterDiscount],
	[closeTime]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_PersonalReportJoin]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderPaymentEvent_PersonalReportJoin] ON [dbo].[OrderPaymentEvent]
(
	[order] ASC,
	[date] ASC
)
INCLUDE ( 	[storned]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderPaymentEvent_revision] ON [dbo].[OrderPaymentEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_session]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderPaymentEvent_session] ON [dbo].[OrderPaymentEvent]
(
	[session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OrderPaymentEvent_sourceOrderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OrderPaymentEvent_sourceOrderId] ON [dbo].[OrderPaymentEvent]
(
	[sourceOrderId] ASC
)
WHERE ([sourceOrderId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OutgoingInvoice_internalIncomingInvoiceId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OutgoingInvoice_internalIncomingInvoiceId] ON [dbo].[OutgoingInvoice]
(
	[internalIncomingInvoiceId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OutgoingInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OutgoingInvoice_revision] ON [dbo].[OutgoingInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OutgoingInvoiceItem_store]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OutgoingInvoiceItem_store] ON [dbo].[OutgoingInvoiceItem]
(
	[store] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OutgoingService_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OutgoingService_revision] ON [dbo].[OutgoingService]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [OutgoingServiceItem_store]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [OutgoingServiceItem_store] ON [dbo].[OutgoingServiceItem]
(
	[store] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PaymentStrategy_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PaymentStrategy_revision] ON [dbo].[PaymentStrategy]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Payroll_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Payroll_revision] ON [dbo].[Payroll]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PreparedAssemblyChart_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PreparedAssemblyChart_revision] ON [dbo].[PreparedAssemblyChart]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PreparedRegisterDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PreparedRegisterDocument_revision] ON [dbo].[PreparedRegisterDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PreparedRegisterItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PreparedRegisterItem_document] ON [dbo].[PreparedRegisterItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PriceListItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PriceListItem_revision] ON [dbo].[PriceListItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableAllIncomeItem_product_store_dateFrom_dateTo]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PriceTableAllIncomeItem_product_store_dateFrom_dateTo] ON [dbo].[PriceTableAllIncomeItem]
(
	[product] ASC,
	[store] ASC,
	[dateFrom] ASC,
	[dateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableAllIncomeItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PriceTableAllIncomeItem_revision] ON [dbo].[PriceTableAllIncomeItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableInvoiceIncomeItem_product_store_dateFrom_dateTo]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PriceTableInvoiceIncomeItem_product_store_dateFrom_dateTo] ON [dbo].[PriceTableInvoiceIncomeItem]
(
	[product] ASC,
	[store] ASC,
	[dateFrom] ASC,
	[dateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableInvoiceIncomeItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PriceTableInvoiceIncomeItem_revision] ON [dbo].[PriceTableInvoiceIncomeItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableItem_product_store_dateFrom_dateTo]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PriceTableItem_product_store_dateFrom_dateTo] ON [dbo].[PriceTableItem]
(
	[product] ASC,
	[store] ASC,
	[dateFrom] ASC,
	[dateTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [PriceTableItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [PriceTableItem_revision] ON [dbo].[PriceTableItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductInventoryEvent_inventory]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductInventoryEvent_inventory] ON [dbo].[ProductInventoryEvent]
(
	[inventory_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductInventoryEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductInventoryEvent_revision] ON [dbo].[ProductInventoryEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductionDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductionDocument_revision] ON [dbo].[ProductionDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductionOrder_InternalTransfer_productionOrder]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductionOrder_InternalTransfer_productionOrder] ON [dbo].[ProductionOrder_InternalTransfer]
(
	[productionOrder_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductionOrder_OutgoingInvoice_productionOrder]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductionOrder_OutgoingInvoice_productionOrder] ON [dbo].[ProductionOrder_OutgoingInvoice]
(
	[productionOrder_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductionOrderDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductionOrderDocument_revision] ON [dbo].[ProductionOrderDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductionOrderItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductionOrderItem_document] ON [dbo].[ProductionOrderItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductReplacementDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductReplacementDocument_revision] ON [dbo].[ProductReplacementDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductStockEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductStockEvent_revision] ON [dbo].[ProductStockEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductWriteoffEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductWriteoffEvent_revision] ON [dbo].[ProductWriteoffEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ProductWriteoffEvent_writeoffDocumentId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ProductWriteoffEvent_writeoffDocumentId] ON [dbo].[ProductWriteoffEvent]
(
	[writeoffDocumentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ReplicationEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ReplicationEvent_revision] ON [dbo].[ReplicationEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Reserve_group]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Reserve_group] ON [dbo].[Reserve]
(
	[group] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Reserve_orderId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Reserve_orderId] ON [dbo].[Reserve]
(
	[orderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Reserve_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Reserve_revision] ON [dbo].[Reserve]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ReturnedInvoice_incomingInvoiceId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ReturnedInvoice_incomingInvoiceId] ON [dbo].[ReturnedInvoice]
(
	[incomingInvoiceId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ReturnedInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ReturnedInvoice_revision] ON [dbo].[ReturnedInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ReturnedInvoice_storeCostAffected]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ReturnedInvoice_storeCostAffected] ON [dbo].[ReturnedInvoice]
(
	[storeCostAffected] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ReturnedInvoiceItem_store]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ReturnedInvoiceItem_store] ON [dbo].[ReturnedInvoiceItem]
(
	[store] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [RoleRequirementItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [RoleRequirementItem_revision] ON [dbo].[RoleRequirementItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SaleItem_deliveryId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SaleItem_deliveryId] ON [dbo].[SaleItem]
(
	[deliveryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [SaleItem_dtype]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SaleItem_dtype] ON [dbo].[SaleItem]
(
	[dtype] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SaleItem_reserveId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SaleItem_reserveId] ON [dbo].[SaleItem]
(
	[reserveId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SalesDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SalesDocument_revision] ON [dbo].[SalesDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SalesDocumentItem_store]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SalesDocumentItem_store] ON [dbo].[SalesDocumentItem]
(
	[store] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [SavedImage_id_checkSum]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SavedImage_id_checkSum] ON [dbo].[SavedImage]
(
	[id] ASC,
	[checkSum] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SavedImage_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SavedImage_revision] ON [dbo].[SavedImage]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SavedImage_usageNotFoundDate]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SavedImage_usageNotFoundDate] ON [dbo].[SavedImage]
(
	[usageNotFoundDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ScheduledIncoming_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ScheduledIncoming_revision] ON [dbo].[ScheduledIncoming]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ScheduledIncomingRequest_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ScheduledIncomingRequest_revision] ON [dbo].[ScheduledIncomingRequest]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ScheduledPayment_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ScheduledPayment_revision] ON [dbo].[ScheduledPayment]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ScheduledPaymentRequest_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ScheduledPaymentRequest_revision] ON [dbo].[ScheduledPaymentRequest]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [ScheduledTaskEntity_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [ScheduledTaskEntity_revision] ON [dbo].[ScheduledTaskEntity]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SessionFullReport_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SessionFullReport_revision] ON [dbo].[SessionFullReport]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SessionFullReport_sessionId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SessionFullReport_sessionId] ON [dbo].[SessionFullReport]
(
	[sessionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SessionRevenueEntry_department]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SessionRevenueEntry_department] ON [dbo].[SessionRevenueEntry]
(
	[department] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SessionRevenueEntry_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SessionRevenueEntry_revision] ON [dbo].[SessionRevenueEntry]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [StopListItem_groupId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [StopListItem_groupId] ON [dbo].[StopListItem]
(
	[groupId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [StopListItem_productId_productSizeId_groupId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [StopListItem_productId_productSizeId_groupId] ON [dbo].[StopListItem]
(
	[productId] ASC,
	[productSizeId] ASC,
	[groupId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [StopListItem_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [StopListItem_revision] ON [dbo].[StopListItem]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [StoreSpecificationEntity_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [StoreSpecificationEntity_revision] ON [dbo].[StoreSpecificationEntity]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [Street_externalId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Street_externalId] ON [dbo].[Street]
(
	[externalId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [Street_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [Street_revision] ON [dbo].[Street]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SupplierPriceList_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SupplierPriceList_revision] ON [dbo].[SupplierPriceList]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SupplierPriceList_supplier]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SupplierPriceList_supplier] ON [dbo].[SupplierPriceList]
(
	[supplier] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [SurveyItemResponse_deliveryOrderId_deliveryid]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [SurveyItemResponse_deliveryOrderId_deliveryid] ON [dbo].[SurveyItemResponse]
(
	[deliveryOrderId] ASC,
	[deliveryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 75) ON [PRIMARY]
GO
/****** Object:  Index [TerminalExchangeState_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [TerminalExchangeState_revision] ON [dbo].[TerminalExchangeState]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [TerminalToken_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [TerminalToken_revision] ON [dbo].[TerminalToken]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [TerminalUpgradeState_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [TerminalUpgradeState_revision] ON [dbo].[TerminalUpgradeState]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [TransformationDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [TransformationDocument_revision] ON [dbo].[TransformationDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [TransformationDocumentItem_document]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [TransformationDocumentItem_document] ON [dbo].[TransformationDocumentItem]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [TreeMenuChangeDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [TreeMenuChangeDocument_revision] ON [dbo].[TreeMenuChangeDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [UserActionEvent_openDate]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [UserActionEvent_openDate] ON [dbo].[UserActionEvent]
(
	[openDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [UserActionEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [UserActionEvent_revision] ON [dbo].[UserActionEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [UserActionEvent_session]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [UserActionEvent_session] ON [dbo].[UserActionEvent]
(
	[session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [UserEvent_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [UserEvent_revision] ON [dbo].[UserEvent]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [UtmDocumentStatus_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [UtmDocumentStatus_revision] ON [dbo].[UtmDocumentStatus]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [VatInvoice_customerId]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [VatInvoice_customerId] ON [dbo].[VatInvoice]
(
	[customerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [VatInvoice_department]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [VatInvoice_department] ON [dbo].[VatInvoice]
(
	[department] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [VatInvoice_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [VatInvoice_revision] ON [dbo].[VatInvoice]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [WriteoffDocument_revision]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [WriteoffDocument_revision] ON [dbo].[WriteoffDocument]
(
	[revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
/****** Object:  Index [WriteoffDocumentItem_writeoffDocument]    Script Date: 04.08.2026 2:25:42 ******/
CREATE NONCLUSTERED INDEX [WriteoffDocumentItem_writeoffDocument] ON [dbo].[WriteoffDocumentItem]
(
	[writeoffDocument_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
GO
